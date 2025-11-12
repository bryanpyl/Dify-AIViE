from flask import request
from flask_login import current_user  # type: ignore
from flask_restx import Resource, inputs, marshal, marshal_with, reqparse  # type: ignore
from werkzeug.exceptions import Forbidden

from controllers.console import api
from controllers.console.wraps import account_initialization_required, setup_required
from fields.group_fields import group_partial_fields, group_pagination_fields
from libs.login import login_required
from models.model import Group, GroupBinding
from services.group_service import GroupService


def _validate_name(name):
    if not name or len(name) < 1 or len(name) > 50:
        raise ValueError("Name must be between 1 to 50 characters.")
    return name


def _validate_agency_name(agency_name):
    if not agency_name or len(agency_name) < 1 or len(agency_name) > 50:
        raise ValueError("Agency name must be between 1 to 50 characters.")
    return agency_name


class GroupListApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument("page", type=inputs.int_range(1, 99999), required=False, default=1, location="args")
        parser.add_argument("limit", type=inputs.int_range(1, 100), required=False, default=20, location="args")
        parser.add_argument("keyword", type=str, location="args", required=False)

        args = parser.parse_args()

        # get group list
        group_service = GroupService()
        group_pagination = group_service.get_paginate_groups(current_user.current_tenant_id, args)
        if not group_pagination:
            return {"data": [], "total": 0, "page": 1, "limit": 20, "has_more": False}

        for group in group_pagination.items:
            group_id = str(group.id)
            group.knowledge_count = GroupService.get_group_knowledge_count(group_id)
            group.app_count = GroupService.get_group_app_count(group_id)
            group.user_count = GroupService.get_group_user_count(group_id)
            group.role_count = GroupService.get_group_role_count(group_id)

        return marshal(group_pagination, group_pagination_fields)

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
            "agency_name", nullable=False, required=True, help="Agency name must be between 1 to 50 characters.", type=_validate_agency_name
        )
        parser.add_argument(
            "description", nullable=False, required=True, type=str
        )
        args = parser.parse_args()
        group = GroupService.save_groups(args)

        response = {"id": group.id, "name": group.name, "agency_name": group.agency_name, "description": group.description, "knowledge_count": 0, "app_count": 0, "user_count": 0, "role_count": 0}

        return response, 200


class GroupViewUpdateDeleteApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(group_partial_fields)
    def get(self, group_id):
        group_id = str(group_id)

        group = GroupService.view_group_details(group_id)
        knowledge_count = GroupService.get_group_knowledge_count(group_id)
        app_count = GroupService.get_group_app_count(group_id)
        user_count = GroupService.get_group_user_count(group_id)
        role_count = GroupService.get_group_role_count(group_id)

        response = {"id": group.id, "name": group.name, "agency_name": group.agency_name, "description": group.description, "knowledge_count": knowledge_count, "app_count": app_count, "user_count": user_count, "role_count": role_count}

        return response, 200

    @setup_required
    @login_required
    @account_initialization_required
    def patch(self, group_id):
        group_id = str(group_id)
        # # The role of the current user in the ta table must be admin, owner, or editor
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "name", nullable=False, required=True, help="Name must be between 1 to 50 characters.", type=_validate_name
        )
        parser.add_argument(
            "agency_name", nullable=False, required=True, help="Agency name must be between 1 to 50 characters.", type=_validate_agency_name
        )
        parser.add_argument(
            "description", nullable=False, required=True, type=str
        )
        args = parser.parse_args()
        group = GroupService.update_groups(args, group_id)

        knowledge_count = GroupService.get_group_knowledge_count(group_id)
        app_count = GroupService.get_group_app_count(group_id)
        user_count = GroupService.get_group_user_count(group_id)
        role_count = GroupService.get_group_role_count(group_id)

        response = {"id": group.id, "name": group.name, "agency_name": group.agency_name, "description": group.description, "knowledge_count": knowledge_count, "app_count": app_count, "user_count": user_count, "role_count": role_count}

        return response, 200

    @setup_required
    @login_required
    @account_initialization_required
    def delete(self, group_id):
        group_id = str(group_id)
        # # The role of the current user in the ta table must be admin, owner, or editor
        # if not current_user.is_editor:
        #     raise Forbidden()

        GroupService.delete_group(group_id)

        response = {"code": "success", "message": "Group deleted successfully.", "status": 200}
    
        return response, 200


class GroupBindingCreateApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "group_id", type=str, nullable=False, required=True, location="json", help="Group ID is required."
        )
        parser.add_argument(
            "target_id", type=list, nullable=False, required=True, location="json", help="Targets ID is required."
        )
        parser.add_argument(
            "type", type=str, location="json", choices=GroupBinding.GROUP_TYPE_LIST, nullable=True, help="Invalid group type."
        )
        args = parser.parse_args()
        GroupService.save_group_binding(args)

        response = {"code": "success", "message": "Targets successfully added to the group.", "status": 200}

        return response, 200


class GroupBindingDeleteApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "group_id", type=str, nullable=False, required=True, location="json", help="Group ID is required."
        )
        parser.add_argument(
            "target_id", type=list, nullable=False, required=True, location="json", help="Target IDs is required."
        )
        parser.add_argument(
            "type", type=str, location="json", choices=GroupBinding.GROUP_TYPE_LIST, nullable=True, help="Invalid group type."
        )
        args = parser.parse_args()
        GroupService.delete_group_binding(args)

        response = {"code": "success", "message": "Targets successfully removed from the group.", "status": 200}

        return response, 200


class GroupBindingUpdateApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def post(self):
        # # The role of the current user in the ta table must be admin, owner, editor, or dataset_operator
        # if not (current_user.is_editor or current_user.is_dataset_editor):
        #     raise Forbidden()

        parser = reqparse.RequestParser()
        parser.add_argument(
            "group_id", type=str, nullable=False, required=True, location="json", help="Group ID is required."
        )
        parser.add_argument(
            "target_id", type=list, nullable=False, required=True, location="json", help="Target IDs is required."
        )
        parser.add_argument(
            "type", type=str, location="json", choices=GroupBinding.GROUP_TYPE_LIST, nullable=True, help="Invalid group type."
        )
        args = parser.parse_args()
        GroupService.update_group_binding(args)

        response = {"code": "success", "message": "Group targets updated successfully.", "status": 200}

        return response, 200


class GroupBindingRetrieveByGroupApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('group_id', type=str, nullable=False, required=True, help='Group ID is required', location="args")
        parser.add_argument('type', type=str, nullable=False, required=True, help='Type is required', location="args")

        args = parser.parse_args()
        response = GroupService.get_target_ids_by_group_id(current_user.current_tenant_id, args['group_id'], args['type'])
        return response


class GroupBindingRetrieveByTargetApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('target_id', type=str, nullable=False, required=True, help='Target ID is required', location='args')
        parser.add_argument('type', type=str,nullable=False, required=True, help='Type is required', location='args')

        args = parser.parse_args()
        response = GroupService.get_group_ids_by_target_id(current_user.current_tenant_id, args['target_id'], args['type'])
        return response


api.add_resource(GroupListApi, "/groups")
api.add_resource(GroupViewUpdateDeleteApi, "/groups/<uuid:group_id>")
api.add_resource(GroupBindingCreateApi, "/group-bindings/create")
api.add_resource(GroupBindingDeleteApi, "/group-bindings/remove")
api.add_resource(GroupBindingUpdateApi, "/group-bindings/update")

api.add_resource(GroupBindingRetrieveByGroupApi,'/group-bindings/by-group')
api.add_resource(GroupBindingRetrieveByTargetApi,'/group-bindings/by-target')
