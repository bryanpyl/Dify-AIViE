import uuid
from typing import Optional

from flask_login import current_user  # type: ignore
from sqlalchemy import func, or_
from werkzeug.exceptions import NotFound

from extensions.ext_database import db
from models.model import Account, GroupBinding, Role, Permission, RolePermissionJoin, RoleAccountJoin, Module, SubModule
from sqlalchemy.sql import case


class RoleService:
    @staticmethod
    def get_roles(current_tenant_id: str, group_id: Optional[str] = None, keyword: Optional[str] = None) -> list:
        query = (
            db.session.query(Role.id, Role.name, Role.description, GroupBinding.group_id, func.count(RoleAccountJoin.id).label("user_count"))
            .outerjoin(GroupBinding, Role.id == GroupBinding.target_id)
            .outerjoin(RoleAccountJoin, Role.id == RoleAccountJoin.role_id)
            .filter(Role.tenant_id == current_tenant_id)
        )
        if group_id:
            query = query.filter(or_(GroupBinding.group_id == group_id, GroupBinding.group_id.is_(None)))

            query = query.order_by(
                case(
                    (GroupBinding.group_id.is_(None), 0),
                    (GroupBinding.group_id == group_id, 1),
                    else_=2
                ),
                Role.created_at.asc()
            )
        else:
            query = query.order_by(
                case(
                    (GroupBinding.group_id.is_(None), 0),
                    else_=1
                ),
                Role.created_at.asc()
            )
        if keyword:
            query = query.filter(db.and_(Role.name.ilike(f"%{keyword}%")))
        query = query.group_by(Role.id, GroupBinding.group_id)
        results: list = query.all()
        return results

    @staticmethod
    def view_role_details(role_id: str) -> Role:
        query = (
            db.session.query(Role.id, Role.name, Role.description, GroupBinding.group_id, func.count(RoleAccountJoin.id).label("user_count"))
            .outerjoin(GroupBinding, Role.id == GroupBinding.target_id)
            .outerjoin(RoleAccountJoin, Role.id == RoleAccountJoin.role_id)
            .filter(Role.id == role_id)

        )
        query = query.group_by(Role.id, GroupBinding.group_id)
        role: list = query.order_by(Role.created_at.desc()).first()

        if not role:
            raise NotFound("Role not found.")

        return role

    @staticmethod
    def save_roles(args: dict) -> Role:
        role = Role(
            id=str(uuid.uuid4()),
            name=args["name"],
            description=args["description"],
            created_by=current_user.id,
            tenant_id=current_user.current_tenant_id,
        )
        db.session.add(role)
        db.session.commit()
        return role

    @staticmethod
    def update_roles(args: dict, role_id: str) -> Role:
        role = db.session.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise NotFound("Role not found.")
        role.name = args["name"]
        role.description = args["description"]
        db.session.commit()
        return role

    @staticmethod
    def get_role_account_count(role_id: str) -> int:
        count = db.session.query(RoleAccountJoin).filter(RoleAccountJoin.role_id == role_id).count()
        return count

    @staticmethod
    def delete_role(role_id: str):
        role = db.session.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise NotFound("Role not found.")

        # delete role permission join
        role_bindings = db.session.query(RolePermissionJoin).filter(RolePermissionJoin.role_id == role_id).all()
        if role_bindings:
            for role_binding in role_bindings:
                db.session.delete(role_binding)

        db.session.delete(role)
        db.session.commit()

    @staticmethod
    def save_role_permission_join(args):
        # check if role and permission exist
        RoleService.check_role_permission_exists(args["role_id"], args["permission_id"])
        # save role permission join
        for permission_id in args["permission_id"]:
            role_permission_joins = (
                db.session.query(RolePermissionJoin)
                .filter(RolePermissionJoin.permission_id == permission_id, RolePermissionJoin.role_id == args["role_id"])
                .first()
            )
            if role_permission_joins:
                continue
            new_role_permission_joins = RolePermissionJoin(
                role_id=args["role_id"],
                permission_id=permission_id,
                tenant_id=current_user.current_tenant_id,
            )
            db.session.add(new_role_permission_joins)
            db.session.commit()

    @staticmethod
    def delete_role_permission_join(args):
        # check if role and permission exist
        RoleService.check_role_permission_exists(args["role_id"], args["permission_id"])
        # delete role permission join
        for permission_id in args["permission_id"]:
            role_permission_joins = (
                db.session.query(RolePermissionJoin)
                .filter(RolePermissionJoin.permission_id == permission_id, RolePermissionJoin.role_id == args["role_id"])
                .first()
            )
            if role_permission_joins:
                db.session.delete(role_permission_joins)
                db.session.commit()

    @staticmethod
    def update_role_permission_join(args):
        # check if role and permission exist
        RoleService.check_role_permission_exists(args["role_id"], args["permission_id"])
        # update role permission join
        existing_role_permission_joins = (
            db.session.query(RolePermissionJoin)
            .filter(RolePermissionJoin.role_id == args["role_id"])
            .all()
        )

        new_permission_ids = args["permission_id"]

        role_permission_joins_to_delete = []
        for role_permission_join in existing_role_permission_joins:
            if role_permission_join.permission_id not in new_permission_ids:
                role_permission_joins_to_delete.append(role_permission_join)

        # delete role permission join
        for role_permission_join in role_permission_joins_to_delete:
            db.session.delete(role_permission_join)
            db.session.commit()

        # save role permission join
        for permission_id in args["permission_id"]:
            role_permission_joins = (
                db.session.query(RolePermissionJoin)
                .filter(RolePermissionJoin.permission_id == permission_id, RolePermissionJoin.role_id == args["role_id"])
                .first()
            )
            if role_permission_joins:
                continue
            new_role_permission_joins = RolePermissionJoin(
                role_id=args["role_id"],
                permission_id=permission_id,
                tenant_id=current_user.current_tenant_id,
            )

            db.session.add(new_role_permission_joins)
            db.session.commit()

    @staticmethod
    def update_role_permission_join_by_module(args):
        # check if role and permission exist
        RoleService.check_role_permission_exists(args["role_id"], args["permission_id"])
        # check if module exists and permission belongs to module's submodule
        RoleService.check_module_permission_exists(args["module_id"], args["permission_id"])
        # update role permission join
        existing_role_permission_joins = (
            db.session.query(RolePermissionJoin)
            .filter(RolePermissionJoin.role_id == args["role_id"])
            .all()
        )

        module_permissions = (
            db.session.query(Permission)
            .join(SubModule, Permission.sub_module_id == SubModule.id)
            .filter(SubModule.module_id == args["module_id"])
            .all()
        )

        module_permission_ids = []
        for module_permission in module_permissions:
            module_permission_ids.append(module_permission.id)

        # Find the permissions that exist in both existing_role_permissions and module_permissions
        existing_module_permissions = []
        for role_permission_join in existing_role_permission_joins:
            if role_permission_join.permission_id in module_permission_ids:
                existing_module_permissions.append(role_permission_join)

        new_permission_ids = args["permission_id"]

        role_permission_joins_to_delete = []
        for module_permission in existing_module_permissions:
            if module_permission.permission_id not in new_permission_ids:
                role_permission_joins_to_delete.append(module_permission)

        # delete role permission join
        for role_permission_join in role_permission_joins_to_delete:
            db.session.delete(role_permission_join)
            db.session.commit()

        # save role permission join
        for permission_id in args["permission_id"]:
            role_permission_joins = (
                db.session.query(RolePermissionJoin)
                .filter(RolePermissionJoin.permission_id == permission_id, RolePermissionJoin.role_id == args["role_id"])
                .first()
            )
            if role_permission_joins:
                continue
            new_role_permission_joins = RolePermissionJoin(
                role_id=args["role_id"],
                permission_id=permission_id,
                tenant_id=current_user.current_tenant_id,
            )

            db.session.add(new_role_permission_joins)
            db.session.commit()

    @staticmethod
    def check_role_permission_exists(role_id: str, permission_ids: str):
        role = (
            db.session.query(Role)
            .filter(Role.tenant_id == current_user.current_tenant_id, Role.id == role_id)
            .first()
        )
        if not role:
            raise NotFound("Role not found.")

        if permission_ids:
            for permission_id in permission_ids:
                permission = (
                    db.session.query(Permission)
                    .filter(Permission.id == permission_id)
                    .first()
                )
            if not permission:
                raise NotFound("Permission not found.")

    @staticmethod
    def check_module_permission_exists(module_id: str, permission_ids: str):
        module = (
            db.session.query(Module)
            .filter(Module.id == module_id)
            .first()
        )
        if not module:
            raise NotFound("Module not found.")

        sub_modules = (
            db.session.query(SubModule)
            .filter(SubModule.module_id == module_id)
            .all()
        )

        sub_module_ids = []
        for submodule in sub_modules:
            sub_module_ids.append(submodule.id)

        if permission_ids:
            for permission_id in permission_ids:
                permission = (
                    db.session.query(Permission)
                    .filter(Permission.id == permission_id, Permission.sub_module_id.in_(sub_module_ids))
                    .first()
                )
            if not permission:
                raise NotFound("Permission not found.")

    @staticmethod
    def save_role_account_join(args):
        # check if role and account exist
        RoleService.check_role_account_exists(args["role_id"], args["account_id"])
        # save role account join
        for account_id in args["account_id"]:
            role_account_joins = (
                db.session.query(RoleAccountJoin)
                .filter(RoleAccountJoin.account_id == account_id)
                .first()
            )
            if role_account_joins:
                continue
            else:
                new_role_account_joins = RoleAccountJoin(
                    role_id=args["role_id"],
                    account_id=account_id,
                    tenant_id=current_user.current_tenant_id,
                    created_by=current_user.id,
                )
                db.session.add(new_role_account_joins)

            db.session.commit()

    @staticmethod
    def update_role_account_join(args):
        # check if role and account exist
        RoleService.check_role_account_exists(args["role_id"], args["account_id"])
        # update role account join
        for account_id in args["account_id"]:
            role_account_joins = (
                db.session.query(RoleAccountJoin)
                .filter(RoleAccountJoin.account_id == account_id)
                .first()
            )
            if role_account_joins:
                role_account_joins.role_id = args["role_id"]
            else:
                new_role_account_joins = RoleAccountJoin(
                    role_id=args["role_id"],
                    account_id=account_id,
                    tenant_id=current_user.current_tenant_id,
                    created_by=current_user.id,
                )
                db.session.add(new_role_account_joins)

            db.session.commit()

    @staticmethod
    def delete_role_account_join(args):
        # check if role and account exist
        RoleService.check_role_account_exists(args["role_id"], args["account_id"])
        # delete role account join
        for account_id in args["account_id"]:
            role_account_joins = (
                db.session.query(RoleAccountJoin)
                .filter(RoleAccountJoin.role_id == args["role_id"], RoleAccountJoin.account_id == account_id)
                .first()
            )
            if role_account_joins:
                db.session.delete(role_account_joins)
                db.session.commit()

    @staticmethod
    def check_role_account_exists(role_id: str, account_ids: str):
        role = (
                db.session.query(Role)
                .filter(Role.tenant_id == current_user.current_tenant_id, Role.id == role_id)
                .first()
            )
        if not role:
            raise NotFound("Role not found.")

        for account_id in account_ids:
            account = (
                db.session.query(Account)
                .filter(Account.id == account_id)
                .first()
            )
            if not account:
                raise NotFound("User not found.")

    @staticmethod
    def get_modules() -> list:
        query = (
            db.session.query(Module.id, Module.name)
        )
        results: list = query.order_by(Module.created_at.desc()).all()
        return results

    @staticmethod
    def get_permissions(current_tenant_id: str, module_id: Optional[str] = None, role_id: Optional[str] = None) -> list:
        query = (
            db.session.query(Module.name, SubModule.name, SubModule.description, Permission.id, Permission.name,Permission.is_superadmin_only)
            .outerjoin(SubModule, Module.id == SubModule.module_id)
            .outerjoin(Permission, SubModule.id == Permission.sub_module_id)
        )

        if module_id:
            query = query.filter(Module.id == module_id)

        if role_id:
            selected_permissions = (
                db.session.query(RolePermissionJoin.permission_id)
                .filter(RolePermissionJoin.tenant_id == current_tenant_id, RolePermissionJoin.role_id == role_id)
                .subquery()
            )

            query = query.add_columns(
                case(
                    (Permission.id.in_(selected_permissions), True),
                    else_=False
                ).label("is_selected")
            )

        rows: list = query.order_by(Module.created_at.desc()).all()

        module_list = []

        for row in rows:
            if role_id:
                module_name, sub_module_name, sub_module_description, permission_id, permission_name, is_superadmin_only, is_selected = row
            else:
                module_name, sub_module_name, sub_module_description, permission_id, permission_name, is_superadmin_only = row
                is_selected = None

            # Find or create the module in the list
            module = None
            for m in module_list:
                if m["name"] == module_name:
                    module = m
                    break  # Stop searching once found

            if not module:
                module = {"name": module_name, "sub_modules": []}
                module_list.append(module)

            # Find or create the sub-module inside the module
            sub_module = None
            for s in module["sub_modules"]:
                if s["name"] == sub_module_name:
                    sub_module = s
                    break  # Stop searching once found

            if not sub_module:
                sub_module = {"name": sub_module_name, "description": sub_module_description or "", "permissions": []}
                module["sub_modules"].append(sub_module)

            if permission_id and permission_name and is_superadmin_only is not None:
                permission = {
                    "id": permission_id,
                    "name": permission_name,
                    "is_superadmin_only": is_superadmin_only
                }
                if role_id:
                    permission["is_selected"] = is_selected

                sub_module["permissions"].append(permission)

        results: list = [
            {
                "name": module["name"],
                "sub_modules": [
                    {
                        "name": sub_module["name"],
                        "description": sub_module["description"],
                        "permissions": sub_module["permissions"]
                    }
                    for sub_module in module["sub_modules"]
                ],
            }
            for module in module_list
        ]

        return results
