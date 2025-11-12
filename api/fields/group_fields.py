from flask_restx import fields  # type: ignore

group_partial_fields = {
    "id": fields.String,
    "name": fields.String,
    "agency_name": fields.String,
    "description": fields.Raw,
    "knowledge_count": fields.String,
    "app_count": fields.String,
    "user_count": fields.String,
    "role_count": fields.String,
}

group_pagination_fields = {
    "page": fields.Integer,
    "limit": fields.Integer(attribute="per_page"),
    "total": fields.Integer,
    "has_more": fields.Boolean(attribute="has_next"),
    "data": fields.List(fields.Nested(group_partial_fields), attribute="items"),
}