from flask_login import current_user

from configs import dify_config
from extensions.ext_database import db
from models.account import Tenant
from models.model import Role, Permission, RolePermissionJoin, RoleAccountJoin, DefaultRoles
from services.account_service import TenantService
from services.feature_service import FeatureService


class WorkspaceService:
    @classmethod
    def get_tenant_info(cls, tenant: Tenant):
        if not tenant:
            return None
        tenant_info: dict[str, object] = {
            "id": tenant.id,
            "name": tenant.name,
            "plan": tenant.plan,
            "status": tenant.status,
            "created_at": tenant.created_at,
            "in_trail": True,
            "trial_end_reason": None,
            "role": "",
        }

        # # Get role of user
        # tenant_account_join = (
        #     db.session.query(TenantAccountJoin)
        #     .filter(TenantAccountJoin.tenant_id == tenant.id, TenantAccountJoin.account_id == current_user.id)
        #     .first()
        # )
        # assert tenant_account_join is not None, "TenantAccountJoin not found"
        # tenant_info["role"] = tenant_account_join.role

        # Get permissions of user
        role_account_join = (
            db.session.query(RoleAccountJoin)
            .filter(
                RoleAccountJoin.tenant_id == tenant.id,
                RoleAccountJoin.account_id == current_user.id
            )
            .first()
        )

        permissions = []
        if role_account_join:
            role = (
                db.session.query(Role)
                .filter(Role.id == role_account_join.role_id)
                .first()
            )
            
            if role:
                # tenant_info["new_role"] = role.name
                tenant_info["role"] = role.name

                permission_codes = (
                    db.session.query(Permission)
                    .join(RolePermissionJoin, Permission.id == RolePermissionJoin.permission_id)
                    .filter(RolePermissionJoin.role_id == role.id)
                    .all()
                )
                for permission in permission_codes:
                    permissions.append(permission.code)

        tenant_info["permissions"] = permissions

        can_replace_logo = FeatureService.get_features(tenant.id).can_replace_logo

        can_replace_logo = FeatureService.get_features(tenant_info["id"]).can_replace_logo

        if can_replace_logo and TenantService.has_roles(
            tenant, current_user, [DefaultRoles.SUPERADMINISTRATOR, DefaultRoles.SYSTEM_OPERATOR]
        ):
            base_url = dify_config.FILES_URL
            replace_webapp_logo = (
                f"{base_url}/files/workspaces/{tenant.id}/webapp-logo"
                if tenant.custom_config_dict.get("replace_webapp_logo")
                else None
            )
            remove_webapp_brand = tenant.custom_config_dict.get("remove_webapp_brand", False)

            tenant_info["custom_config"] = {
                "remove_webapp_brand": remove_webapp_brand,
                "replace_webapp_logo": replace_webapp_logo,
            }

        return tenant_info
