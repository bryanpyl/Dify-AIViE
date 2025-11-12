from flask_restx import fields  # type: ignore

role_fields = {
    "id": fields.String,
    "name": fields.String,
    "description": fields.Raw,
    "group_id": fields.String,
    "user_count": fields.String,
}

module_fields = {
    "id": fields.String,
    "name": fields.String,
}

permission_fields = {
    "id": fields.String,
    "name": fields.String,
    "is_superadmin_only": fields.Boolean,
    "is_selected": fields.Boolean
}

sub_module_fields = {
    "name": fields.String,
    "description": fields.String,
    "permissions": fields.List(fields.Nested(permission_fields)),
}

module_detail_fields = {
    "name": fields.String,
    "sub_modules": fields.List(fields.Nested(sub_module_fields)),
}
