import uuid
from typing import Optional

from flask_login import current_user  # type: ignore
from flask_sqlalchemy.pagination import Pagination
from sqlalchemy import or_
from werkzeug.exceptions import NotFound

from extensions.ext_database import db
from models.account import TenantAccountJoin
from models.dataset import Dataset
from models.model import App, Group, GroupBinding, Role, RolePermissionJoin


class GroupService:
    def get_paginate_groups(self, current_tenant_id: str, args: dict) -> Pagination | None:
        """
        Get group list with pagination
        :param tenant_id: tenant id
        :param args: request args
        :return:
        """
        filters = [Group.tenant_id == current_tenant_id]
        
        if args.get("keyword"):
            keyword = args["keyword"][:30]
            filters.append(
                or_(
                    Group.name.ilike(f"%{keyword}%"),
                    Group.agency_name.ilike(f"%{keyword}%")
                )
            )

        group_models = db.paginate(
            db.select(Group).where(*filters).order_by(Group.created_at.desc()),
            page=args["page"],
            per_page=args["limit"],
            error_out=False,
        )

        return group_models

    @staticmethod
    def get_target_ids_by_group_id(current_tenant_id: str, group_id: str, type: str) -> list:
        group_bindings = (
            db.session.query(GroupBinding.target_id)
            .filter(GroupBinding.tenant_id == current_tenant_id, GroupBinding.group_id==group_id, GroupBinding.type==type)
            .all()
        )
        if not group_bindings:
            return []
        results = [group_binding.target_id for group_binding in group_bindings]
        return results

    @staticmethod
    def get_group_ids_by_target_id(current_tenant_id: str, target_id: str, type: str, ) -> list:
        groups = (
            db.session.query(Group)
            .join(GroupBinding, Group.id == GroupBinding.group_id)
            .filter(
                GroupBinding.tenant_id == current_tenant_id,
                GroupBinding.target_id == target_id,
                GroupBinding.type == type,
                Group.tenant_id == current_tenant_id,
            )
            .all()
        )

        if not groups:
            return []
        results = [group.id for group in groups]
        return results

    @staticmethod
    def save_groups(args: dict) -> Group:
        group = Group(
            id=str(uuid.uuid4()),
            name=args["name"],
            agency_name=args["agency_name"],
            description=args["description"],
            created_by=current_user.id,
            tenant_id=current_user.current_tenant_id,
        )
        db.session.add(group)
        db.session.commit()
        return group

    @staticmethod
    def view_group_details(group_id: str) -> Group:
        group = db.session.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise NotFound("Group not found.")

        return group

    @staticmethod
    def update_groups(args: dict, group_id: str) -> Group:
        group = db.session.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise NotFound("Group not found.")
        group.name = args["name"]
        group.agency_name = args["agency_name"]
        group.description = args["description"]
        db.session.commit()
        return group

    @staticmethod
    def get_group_knowledge_count(group_id: str) -> int:
        count = db.session.query(GroupBinding).filter(GroupBinding.group_id == group_id, GroupBinding.type == "knowledge").count()
        return count

    @staticmethod
    def get_group_app_count(group_id: str) -> int:
        count = db.session.query(GroupBinding).filter(GroupBinding.group_id == group_id, GroupBinding.type == "app").count()
        return count

    @staticmethod
    def get_group_user_count(group_id: str) -> int:
        count = db.session.query(GroupBinding).filter(GroupBinding.group_id == group_id, GroupBinding.type == "user").count()
        return count

    @staticmethod
    def get_group_role_count(group_id: str) -> int:
        default_role_count = db.session.query(Role).outerjoin(GroupBinding, Role.id == GroupBinding.target_id).filter(GroupBinding.group_id.is_(None), Role.name != "Superadministrator", Role.name != "System Operator").count()
        group_role_count = db.session.query(GroupBinding).filter(GroupBinding.group_id == group_id, GroupBinding.type == "role").count()
        count = default_role_count + group_role_count
        return count

    @staticmethod
    def delete_group(group_id: str):
        group = db.session.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise NotFound("Group not found.")

        # delete group binding
        group_bindings = db.session.query(GroupBinding).filter(GroupBinding.group_id == group_id).all()
        if group_bindings:
            for group_binding in group_bindings:
                # delete role
                if group_binding.type == "role":
                    role = db.session.query(Role).filter(Role.id == group_binding.target_id).first()
                    if role:
                        # delete role binding
                        role_bindings = db.session.query(RolePermissionJoin).filter(RolePermissionJoin.role_id == group_binding.target_id).all()
                        if role_bindings:
                            for role_binding in role_bindings:
                                db.session.delete(role_binding)

                        db.session.delete(role)

                db.session.delete(group_binding)

        # delete group
        db.session.delete(group)
        db.session.commit()

    @staticmethod
    def save_group_binding(args):
        # check if target exists
        GroupService.check_target_exists(args["type"], args["target_id"])
        # save group binding
        for target_id in args["target_id"]:
            group_bindings = (
                db.session.query(GroupBinding)
                .filter(GroupBinding.target_id == target_id)
                .first()
            )
            if group_bindings:
                continue
            new_group_bindings = GroupBinding(
                group_id=args["group_id"],
                target_id=target_id,
                type=args["type"],
                tenant_id=current_user.current_tenant_id,
                created_by=current_user.id,
            )
            db.session.add(new_group_bindings)
            db.session.commit()

    @staticmethod
    def delete_group_binding(args):
        # check if target exists
        GroupService.check_target_exists(args["type"], args["target_id"])
        # delete group binding
        for target_id in args["target_id"]:
            group_bindings = (
                db.session.query(GroupBinding)
                .filter(GroupBinding.target_id == target_id, GroupBinding.group_id == args["group_id"])
                .first()
            )
            if group_bindings:
                db.session.delete(group_bindings)
                db.session.commit()

    @staticmethod
    def update_group_binding(args):
        # check if target exists
        GroupService.check_target_exists(args["type"], args["target_id"])
        # update group binding
        existing_group_bindings = (
            db.session.query(GroupBinding)
            .filter(GroupBinding.type == args["type"], GroupBinding.group_id == args["group_id"])
            .all()
        )

        new_target_ids = args["target_id"]

        group_bindings_to_delete = []
        for group_bindings in existing_group_bindings:
            if group_bindings.target_id not in new_target_ids:
                group_bindings_to_delete.append(group_bindings)

        # delete group binding
        for group_bindings in group_bindings_to_delete:
            db.session.delete(group_bindings)
            db.session.commit()

        # save group binding
        for target_id in args["target_id"]:
            group_bindings = (
                db.session.query(GroupBinding)
                .filter(GroupBinding.target_id == target_id, GroupBinding.group_id == args["group_id"])
                .first()
            )
            if group_bindings:
                continue
            new_group_bindings = GroupBinding(
                group_id=args["group_id"],
                target_id=target_id,
                type=args["type"],
                tenant_id=current_user.current_tenant_id,
                created_by=current_user.id,
            )
            
            db.session.add(new_group_bindings)
            db.session.commit()

    @staticmethod
    def check_target_exists(type: str, target_ids: str):
        if target_ids:
            if type == "knowledge":
                for target_id in target_ids:
                    dataset = (
                        db.session.query(Dataset)
                        .filter(Dataset.tenant_id == current_user.current_tenant_id, Dataset.id == target_id)
                        .first()
                    )
                    if not dataset:
                        raise NotFound("Dataset not found.")
            elif type == "app":
                for target_id in target_ids:
                    app = (
                        db.session.query(App)
                        .filter(App.tenant_id == current_user.current_tenant_id, App.id == target_id)
                        .first()
                    )
                    if not app:
                        raise NotFound("App not found.")
            elif type == "user":
                for target_id in target_ids:
                    user = (
                        db.session.query(TenantAccountJoin)
                        .filter(TenantAccountJoin.tenant_id == current_user.current_tenant_id, TenantAccountJoin.account_id == target_id)
                        .first()
                    )
                    if not user:
                        raise NotFound("User not found.")
            elif type == "role":
                for target_id in target_ids:
                    role = (
                        db.session.query(Role)
                        .filter(Role.tenant_id == current_user.current_tenant_id, Role.id == target_id)
                        .first()
                    )
                    if not role:
                        raise NotFound("Role not found.")
            else:
                raise NotFound("Invalid binding type")
