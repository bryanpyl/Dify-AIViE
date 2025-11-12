from app_factory import create_app
from extensions.ext_database import db 
# from models.account import Tenant
from models import Role, Tenant, Permission, RolePermissionJoin, SubModule
app = create_app()

def seed_default_role(default_role):
    with app.app_context():
        current_tenant_id = db.session.query(Tenant).with_entities(Tenant.id).scalar()
        existing_role = db.session.query(Role).filter_by(name=default_role["name"]).first()
        if existing_role:
            print(f"Role {default_role['name']} already exists. Skipping seeding.")
            return
        new_role = Role(**default_role, tenant_id=current_tenant_id)
        db.session.add(new_role)
        db.session.commit()
        print(f"Role {default_role['name']} successfully seeded.")
        
superadministrator = {
    'name':"Superadministrator",
    'description':"Superadministrator that oversees the entire platform.",
}

system_operator = {
    'name':'System Operator',
    'description':'System operator is granted with the access to manage the platform.'
}

administrator = {
    'name':"Administrator",
    'description':"Group's administrator. This role is granted with access to knowledge and monitoring panel.",
}

chat_user = {
    'name':"Chat User",
    'description':"Chat user is allowed to use chat platform to perform enquiries.",
}


def seed_default_permissions (default_role):
    with app.app_context():
        current_tenant_id = db.session.query(Tenant).with_entities(Tenant.id).scalar()
        existing_role = db.session.query(Role).filter_by(name=default_role["name"]).first()
        if existing_role:
            if existing_role.name=='Superadministrator' or existing_role.name=="System Operator":
                roles_and_perm_module_id = db.session.query(SubModule).filter_by(name='Roles and Permission Management').first()
                permissions = db.session.query(Permission).filter(
                                ~Permission.id.in_(
                                    db.session.query(Permission).filter(
                                        Permission.code!='view-role-and-permission',
                                        Permission.sub_module_id==roles_and_perm_module_id.id
                                        ).with_entities(Permission.id)
                                    )
                                ).all()
                
            elif existing_role.name=='Administrator':
                permissions = db.session.query(Permission).filter_by(is_superadmin_only=False).all()
            # elif existing_role.name=='Chat User':
            #     chat_permissions = ['Chat Platform','View Knowledge Base','AI Analytics Platform']
            #     permissions = []
            #     for chat_permission in chat_permissions:
            #         seed_permissions = Permission.query.filter_by(name=chat_permission).first()
            #         if seed_permissions:
            #             permissions.append(seed_permissions)
            for permission in permissions:
                existing_binding = db.session.query(RolePermissionJoin).filter_by(
                                        tenant_id=current_tenant_id,
                                        role_id=existing_role.id,
                                        permission_id=permission.id
                                    ).first()
                if existing_binding:
                    print(f'Existing permission {permission.name} found for role {existing_role.name}. Skipped seeding...')
                    continue
                else:
                    permission_binding = RolePermissionJoin(tenant_id=current_tenant_id, role_id = existing_role.id, permission_id=permission.id)
                    db.session.add(permission_binding)
                    db.session.commit()
                    print(f'Role {existing_role.name} successfully seeded permission : {permission.name}.')
        else:
            print(f"Role {default_role['name']} does not exists. Permission seeding failed. Skipping...")

def main(): 
    with app.app_context():
        seed_default_role(superadministrator)
        seed_default_role(system_operator)
        seed_default_role(administrator)
        # No need for chat_user in AIVIE
        # seed_default_role(chat_user)
        seed_default_permissions(superadministrator)
        seed_default_permissions(system_operator)
        seed_default_permissions(administrator)
        # seed_default_permissions(chat_user)
    

if __name__ == "__main__":
    main()
