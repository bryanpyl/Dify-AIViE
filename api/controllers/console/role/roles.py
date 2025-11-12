from flask import request
from flask_login import current_user  # type: ignore
from flask_restx import Resource, marshal_with, reqparse  # type: ignore
from werkzeug.exceptions import Forbidden

from controllers.console import api
from controllers.console.wraps import account_initialization_required, setup_required
from fields.role_fields import role_fields, module_fields, module_detail_fields
from libs.login import login_required
from models.model import Role
from services.role_service import RoleService


def _validate_name(name):
    if not name or len(name) < 1 or len(name) > 50:
        raise ValueError("Name must be between 1 to 50 characters.")
    return name


class RoleListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(role_fields)
    def get(self):
        group_id = request.args.get("group_id", default=None, type=str)
        keyword = request.args.get("keyword", default=None, type=str)
        roles = RoleService.get_roles(current_user.current_tenant_id, group_id, keyword)

        return roles, 200

    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # The role of the current user in the ta table must be admin, owner, or editor
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "name", nullable=False, required=True, help="Name must be between 1 to 50 characters.", type=_validate_name
        )
        parser.add_argument(
            "description", nullable=False, required=True, type=str
        )
        args = parser.parse_args()
        role = RoleService.save_roles(args)

        response = {"id": role.id, "name": role.name, "description": role.description, "user_count": 0}

        return response, 200


class RoleViewUpdateDeleteApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(role_fields)
    def get(self, role_id):
        role_id = str(role_id)

        role = RoleService.view_role_details(role_id)

        return role, 200

    @setup_required
    @login_required
    @account_initialization_required
    def patch(self, role_id):
        role_id = str(role_id)
        # # The role of the current user in the ta table must be admin, owner, or editor
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "name", nullable=False, required=True, help="Name must be between 1 to 50 characters.", type=_validate_name
        )
        parser.add_argument(
            "description", nullable=False, required=True, type=str
        )
        args = parser.parse_args()
        role = RoleService.update_roles(args, role_id)

        user_count = RoleService.get_role_account_count(role_id)

        response = {"id": role.id, "name": role.name, "description": role.description, "user_count": user_count}

        return response, 200

    @setup_required
    @login_required
    @account_initialization_required
    def delete(self, role_id):
        role_id = str(role_id)
        # # The role of the current user in the ta table must be admin, owner, or editor
        # if not current_user.is_editor:
        #     raise Forbidden()

        RoleService.delete_role(role_id)

        response = {"code": "success", "message": "Role deleted successfully.", "status": 200}

        return response, 200


class RolePermissionJoinCreateApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "role_id", type=str, nullable=False, required=True, location="json", help="Role ID is required."
        )
        parser.add_argument(
            "permission_id", type=list, nullable=False, required=True, location="json", help="Permission IDs is required."
        )
        args = parser.parse_args()
        RoleService.save_role_permission_join(args)

        response = {"code": "success", "message": "Permissions successfully added to the role.", "status": 200}

        return response, 200


class RolePermissionJoinDeleteApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "role_id", type=str, nullable=False, required=True, location="json", help="Role ID is required."
        )
        parser.add_argument(
            "permission_id", type=list, nullable=False, required=True, location="json", help="Permission IDs is required."
        )
        args = parser.parse_args()
        RoleService.delete_role_permission_join(args)

        response = {"code": "success", "message": "Permissions successfully removed from the role.", "status": 200}

        return response, 200


class RolePermissionJoinUpdateApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "role_id", type=str, nullable=False, required=True, location="json", help="Role ID is required."
        )
        parser.add_argument(
            "permission_id", type=list, nullable=False, required=True, location="json", help="Permission IDs is required."
        )
        parser.add_argument(
            "module_id", type=str, nullable=False, required=True, location="json", help="Module ID is required."
        )
        args = parser.parse_args()
        RoleService.update_role_permission_join_by_module(args)

        response = {"code": "success", "message": "Role permissions updated successfully.", "status": 200}

        return response, 200


class RoleAccountJoinCreateApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "role_id", type=str, nullable=False, required=True, location="json", help="Role ID is required."
        )
        parser.add_argument(
            "account_id", type=list, nullable=False, required=True, location="json", help="Account IDs is required."
        )
        args = parser.parse_args()
        RoleService.save_role_account_join(args)

        response = {"code": "success", "message": "Role successfully assigned to the user.", "status": 200}

        return response, 200

class RoleAccountJoinUpdateApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "role_id", type=str, nullable=False, required=True, location="json", help="Role ID is required."
        )
        parser.add_argument(
            "account_id", type=list, nullable=False, required=True, location="json", help="Account IDs is required."
        )
        args = parser.parse_args()
        RoleService.update_role_account_join(args)

        response = {"code": "success", "message": "Role successfully assigned to the user.", "status": 200}

        return response, 200

class RoleAccountJoinDeleteApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "role_id", type=str, nullable=False, required=True, location="json", help="Role ID is required."
        )
        parser.add_argument(
            "account_id", type=list, nullable=False, required=True, location="json", help="Account IDs is required."
        )
        args = parser.parse_args()
        RoleService.delete_role_account_join(args)

        response = {"code": "success", "message": "Role successfully removed from the user.", "status": 200}

        return response, 200


class ModuleListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(module_fields)
    def get(self):
        modules = RoleService.get_modules()

        return modules, 200


class PermissionListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(module_detail_fields)
    def get(self):
        module_id = request.args.get("module_id", default=None, type=str)
        role_id = request.args.get("role_id", default=None, type=str)
        permissions = RoleService.get_permissions(current_user.current_tenant_id, module_id, role_id)

        return permissions, 200


api.add_resource(RoleListApi, "/roles")
api.add_resource(RoleViewUpdateDeleteApi, "/roles/<uuid:role_id>")
api.add_resource(RolePermissionJoinCreateApi, "/role-bindings/create")
api.add_resource(RolePermissionJoinDeleteApi, "/role-bindings/remove")
api.add_resource(RolePermissionJoinUpdateApi, "/role-bindings/update")

api.add_resource(RoleAccountJoinCreateApi, "/role-account-joins/create")
api.add_resource(RoleAccountJoinUpdateApi, "/role-account-joins/update")
api.add_resource(RoleAccountJoinDeleteApi, "/role-account-joins/delete")

api.add_resource(ModuleListApi, "/modules")
api.add_resource(PermissionListApi, "/permissions")
