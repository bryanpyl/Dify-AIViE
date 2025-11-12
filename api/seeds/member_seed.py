import tomllib
from app_factory import create_app
from extensions.ext_database import db 
from models import Tenant, Account, DifySetup, RoleAccountJoin, Role
from services.account_service import AccountService, TenantService
from constants.languages import languages
from configs import dify_config

app = create_app()

def get_current_version():
    with open("pyproject.toml", "rb") as f:
        data = tomllib.load(f)
    return data["project"]["version"]

def seed_tenant_member():
    with app.app_context():
        tenant = db.session.query(Tenant).filter_by(name="AI-ViE Workspace").first()
        if not tenant:
            print("Tenant not found. Aborting.")
            return

        email = "janedoe.ai@sains.com.my"
        name = "janedoe"
        role_name = "Superadministrator"

        account = db.session.query(Account).filter_by(email=email).first()
        if not account:
            print("Account not found. Creating one...")
            account = AccountService.create_account(
                email=email,
                name=name,
                password=None,
                interface_language=languages[0],
                is_setup=True
            )
            print(f"Created account: {account.email}")

        member = TenantService.create_tenant_member(
            tenant=tenant,
            account=account,
        )

        role_account_join = db.session.query(RoleAccountJoin).filter_by(account_id=account.id, tenant_id=tenant.id).first()
        if not role_account_join:
            print("Account not yet bind to any role.. Binding default role now...")
            superadmin_role = db.session.query(Role).filter_by(name='Superadministrator').first()
            account_superadmin = RoleAccountJoin(tenant_id=tenant.id,account_id=account.id, role_id=superadmin_role.id)
            db.session.add(account_superadmin)
            db.session.commit()
            print(f'Successfully bind {account.email} to {superadmin_role.name} role in {tenant.name}.')
        else:
            print('Account already bind to role')
        print(f"Assigned role '{role_name}' to account '{account.email}' under tenant '{tenant.name}'.")

        setup = db.session.query(DifySetup).first()
        current_version = get_current_version()

        if not setup:
            dify_setup = DifySetup(version=current_version)
            db.session.add(dify_setup)
            db.session.commit()
            print(f"DifySetup created with version: {current_version}")
        else:
            print(f"DifySetup already exists. Current version: {setup.version}")

if __name__ == "__main__":
    seed_tenant_member()