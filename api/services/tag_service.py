import uuid
from typing import Optional

import sqlalchemy as sa
from flask_login import current_user
from sqlalchemy import func, select
from werkzeug.exceptions import NotFound

from extensions.ext_database import db
from models.account import TenantAccountJoin
from models.dataset import Dataset
from models.model import Account, App, Tag, TagBinding


class TagService:
    @staticmethod
    def is_name_exist(name: str):
        query = (
            db.session.query(Tag)
            .filter(func.lower(Tag.name) == func.lower(name))
            .first()
        )
        return query is not None

    @staticmethod
    def get_tags(tag_type: str, current_tenant_id: str, keyword: str | None = None):
        query = (
            db.session.query(Tag.id, Tag.type, Tag.name, Account.name.label("created_by_name"), func.count(TagBinding.id).label("binding_count"))
            .outerjoin(TagBinding, Tag.id == TagBinding.tag_id)
            .outerjoin(Account, Tag.created_by == Account.id)
            .filter(Tag.type == tag_type, Tag.tenant_id == current_tenant_id)
        )
        if keyword:
            query = query.where(sa.and_(Tag.name.ilike(f"%{keyword}%")))
        query = query.group_by(Tag.id, Account.id)
        results: list = query.order_by(Tag.name.asc()).all()
        return results

    @staticmethod
    def get_target_ids_by_tag_ids(tag_type: str, current_tenant_id: str, tag_ids):
        # 🔹 Normalize tag_ids to always be a list
        if not tag_ids:
            return []

        # If tag_ids is a single string (possibly comma-separated)
        if isinstance(tag_ids, str):
            tag_ids = [tid.strip() for tid in tag_ids.split(",") if tid.strip()]

        # If it's a single UUID (not list/tuple/set)
        elif not isinstance(tag_ids, (list, tuple, set)):
            tag_ids = [tag_ids]

        # Double-check after normalization
        if len(tag_ids) == 0:
            return []

        # 🔹 Query for Tag records matching provided tag IDs
        tags = db.session.scalars(
            select(Tag).where(
                Tag.id.in_(tag_ids),
                Tag.tenant_id == current_tenant_id,
                Tag.type == tag_type
            )
        ).all()

        if not tags:
            return []

        # Extract validated tag IDs from found tags
        tag_ids = [tag.id for tag in tags]

        if len(tag_ids) == 0:
            return []

        # 🔹 Query for TagBinding entries linked to those tag IDs
        tag_bindings = db.session.scalars(
            select(TagBinding.target_id).where(
                TagBinding.tag_id.in_(tag_ids),
                TagBinding.tenant_id == current_tenant_id
            )
        ).all()

        return tag_bindings

    
    @staticmethod
    def get_target_ids_by_tag_name(tag_subtype:str, tag_name:str):
        tag_id = (db.session.query(Tag).filter(Tag.name==tag_name).first())
        if (tag_id):
            tag_binding = (
                db.session.query(TagBinding).filter(
                    TagBinding.tag_id==tag_id.id, 
                    TagBinding.subtype==tag_subtype,
                    ).first()
            )
            if tag_binding:
                return tag_binding.target_id
            else:
                raise NotFound("Tag Binding not found")
        else:
            raise NotFound("Tag not found")


    @staticmethod
    def get_tag_by_tag_name(tag_type: str, current_tenant_id: str, tag_name: str):
        if not tag_type or not tag_name:
            return []
        tags = list(
            db.session.scalars(
                select(Tag).where(Tag.name == tag_name, Tag.tenant_id == current_tenant_id, Tag.type == tag_type)
            ).all()
        )
        if not tags:
            return []
        return tags

    @staticmethod
    def get_tags_by_target_id(tag_type: str, current_tenant_id: str, target_id: str):
        tags = (
            db.session.query(Tag)
            .join(TagBinding, Tag.id == TagBinding.tag_id)
            .where(
                TagBinding.target_id == target_id,
                TagBinding.tenant_id == current_tenant_id,
                Tag.tenant_id == current_tenant_id,
                Tag.type == tag_type,
            )
            .all()
        )

        return tags or []

    @staticmethod
    def save_tags(args: dict) -> Tag:
        if TagService.get_tag_by_tag_name(args["type"], current_user.current_tenant_id, args["name"]):
            raise ValueError("Tag name already exists")
        tag = Tag(
            id=str(uuid.uuid4()),
            name=args["name"],
            type=args["type"],
            created_by=current_user.id,
            tenant_id=current_user.current_tenant_id,
        )
        db.session.add(tag)
        db.session.commit()
        return tag

    @staticmethod
    def update_tags(args: dict, tag_id: str) -> Tag:
        if TagService.get_tag_by_tag_name(args.get("type", ""), current_user.current_tenant_id, args.get("name", "")):
            raise ValueError("Tag name already exists")
        tag = db.session.query(Tag).where(Tag.id == tag_id).first()
        if not tag:
            raise NotFound("Tag not found")
        tag.name = args["name"]
        db.session.commit()
        return tag

    @staticmethod
    def get_tag_binding_count(tag_id: str) -> int:
        count = db.session.query(TagBinding).where(TagBinding.tag_id == tag_id).count()
        return count

    @staticmethod
    def delete_tag(tag_id: str):
        tag = db.session.query(Tag).where(Tag.id == tag_id).first()
        if not tag:
            raise NotFound("Tag not found")
        db.session.delete(tag)
        # delete tag binding
        tag_bindings = db.session.scalars(select(TagBinding).where(TagBinding.tag_id == tag_id)).all()
        if tag_bindings:
            for tag_binding in tag_bindings:
                db.session.delete(tag_binding)
        db.session.commit()

    @staticmethod
    def save_tag_binding(args):
        # check if target exists
        TagService.check_target_exists(args["type"], args["subtype"], args["target_id"])
        # save tag binding
        for tag_id in args["tag_ids"]:
            tag_binding = (
                db.session.query(TagBinding)
                .where(TagBinding.tag_id == tag_id, TagBinding.target_id == args["target_id"])
                .first()
            )
            if tag_binding:
                continue
            new_tag_binding = TagBinding(
                tag_id=tag_id,
                target_id=args["target_id"],
                subtype=args["subtype"],
                tenant_id=current_user.current_tenant_id,
                created_by=current_user.id,
            )
            db.session.add(new_tag_binding)
        db.session.commit()

    @staticmethod
    def delete_tag_binding(args):
        # check if target exists
        TagService.check_target_exists(args["type"], args["subtype"], args["target_id"])
        # delete tag binding
        tag_bindings = (
            db.session.query(TagBinding)
            .where(TagBinding.target_id == args["target_id"], TagBinding.tag_id == (args["tag_id"]))
            .first()
        )
        if tag_bindings:
            db.session.delete(tag_bindings)
            db.session.commit()

    @staticmethod
    def check_target_exists(type: str, subtype: str, target_id: str):
        if subtype == "knowledge":
            dataset = (
                db.session.query(Dataset)
                .filter(Dataset.tenant_id == current_user.current_tenant_id, Dataset.id == target_id)
                .first()
            )
            if not dataset:
                raise NotFound("Dataset not found")
        elif subtype == "app":
            app = (
                db.session.query(App)
                .filter(App.tenant_id == current_user.current_tenant_id, App.id == target_id)
                .first()
            )
            if not app:
                raise NotFound("App not found")
        elif subtype == "user":
            user = (
                db.session.query(TenantAccountJoin)
                .filter(TenantAccountJoin.tenant_id == current_user.current_tenant_id, TenantAccountJoin.account_id == target_id)
                .first()
            )
            if not user:
                raise NotFound("User not found")
        else:
            raise NotFound("Invalid binding type")
