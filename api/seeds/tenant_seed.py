from app_factory import create_app
from extensions.ext_database import db 
from models import Tenant
from services.account_service import TenantService

app = create_app()

def seed_tenant():
    with app.app_context():
        tenant = db.session.query(Tenant).filter_by(name="AI-ViE Workspace").first()
        if tenant:
            print(f"Tenant '{tenant.name}' already exists. Skipping seeding.")
        else:
            tenant = TenantService.create_tenant(name="AI-ViE Workspace", is_setup=True)
            print(f"Tenant '{tenant.name}' created.")

if __name__ == "__main__":
    seed_tenant()