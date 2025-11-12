from app_factory import create_app
from extensions.ext_database import db
from models import Permission, Module, SubModule

app = create_app()
def seed_permissions(permission_categories):
    """Insert permissions from categorized lists if they don't already exist."""
    with app.app_context():
        for category in permission_categories:  # Loop through each category (list of permission lists)
            for perm in category:
                existing_module = db.session.query(Module).filter_by(name=perm['module_name']).first()
                if existing_module:
                    existing_submodule= db.session.query(SubModule).filter_by(name=perm['submodule_name'], module_id=existing_module.id).first()
                    if existing_submodule:
                        existing_permission = db.session.query(Permission).filter_by(code=perm['code'], name=perm['name'],sub_module_id = existing_submodule.id).first()
                        if existing_permission:
                            print(f"Permission {perm['code'], perm['name']} {perm['submodule_name']} already seeded. Skipping...")
                        else:
                            new_permission = Permission (code=perm['code'], name = perm['name'], sub_module_id= existing_submodule.id, is_superadmin_only=perm['is_superadmin_only'])
                            db.session.add(new_permission)
                            db.session.commit()
                            print(f"Permissions {perm['code'], perm['name']} {perm['submodule_name']} seeded successfully!")
                    else:
                        print(f"Submodule {perm['submodule_name']} does not exists. Skipping...")
                else:
                    print(f"Module {perm['module_name']} does not exists. Skipping...")
                    


# Application (Studio permissions)
application_management_permissions = [
    {"code": "create-application", "name": "Create Application", "submodule_name": "Application Management", "module_name": "Studio", "is_superadmin_only": False},
    {"code": "edit-application", "name": "Edit Application", "submodule_name": "Application Management", "module_name": "Studio", "is_superadmin_only": False},
    {"code": "view-application", "name": "View Application", "submodule_name": "Application Management", "module_name": "Studio", "is_superadmin_only": False},
    {"code": "delete-application", "name": "Delete Application", "submodule_name": "Application Management", "module_name": "Studio", "is_superadmin_only": False},
]

application_orchestration_permissions = [
    {"code": "edit-orchestration", "name": "Edit Orchestration", "submodule_name": "Application Orchestration", "module_name": "Studio", "is_superadmin_only": False},
    {"code": "view-orchestration", "name": "View Orchestration", "submodule_name": "Application Orchestration", "module_name": "Studio", "is_superadmin_only": False},
]

application_logs_and_annotation_permissions = [
    {"code": "view-logs-and-annotation", "name": "View Logs and Annotation", "submodule_name": "Logs and Annotation", "module_name": "Studio", "is_superadmin_only": False},
    {"code": "create-logs-and-annotation", "name": "Create Logs and Annotation", "submodule_name": "Logs and Annotation", "module_name": "Studio", "is_superadmin_only": False},
    {"code": "edit-logs-and-annotation", "name": "Edit Logs and Annotation", "submodule_name": "Logs and Annotation", "module_name": "Studio", "is_superadmin_only": False},
    {"code": "delete-logs-and-annotation", "name": "Delete Logs and Annotation", "submodule_name": "Logs and Annotation", "module_name": "Studio",  "is_superadmin_only": False},
]

application_monitoring_site_management_permissions = [
    {"code": "view-site-settings", "name": "View Site Settings", "submodule_name": "Site Management", "module_name": "Studio", "is_superadmin_only": False},
    {"code": "edit-site-settings", "name": "Edit Site Settings", "submodule_name": "Site Management", "module_name": "Studio", "is_superadmin_only": False},
]

application_monitoring_api_service_permissions = [
    {"code": "view-api-settings", "name": "View API Settings", "submodule_name": "API Service", "module_name": "Studio", "is_superadmin_only": True},
    {"code": "create-studio-api-key", "name": "Create API Key", "submodule_name": "API Service", "module_name":"Studio", "is_superadmin_only": True},
    {"code": "edit-studio-api-key", "name": "Edit API Key", "submodule_name": "API Service", "module_name":"Studio", "is_superadmin_only": True},
    {"code": "delete-studio-api-key", "name": "Delete API Key", "submodule_name": "API Service", "module_name":"Studio", "is_superadmin_only": True},
]

application_performance_analysis_permissions = [
    {"code": "view-performance-analysis", "name": "View Performance Analysis", "submodule_name": "Performance Monitoring", "module_name": "Studio", "is_superadmin_only": False},
]

# Knowledge Base 
knowledge_base_management_permissions = [
    {"code": "create-knowledge", "name": "Create Knowledge", "submodule_name": "Knowledge Management", "module_name": "Knowledge Base", "is_superadmin_only": False},
    {"code": "view-knowledge", "name": "View Knowledge", "submodule_name": "Knowledge Management", "module_name": "Knowledge Base", "is_superadmin_only": False},
    {"code": "delete-knowledge", "name": "Delete Knowledge", "submodule_name": "Knowledge Management", "module_name": "Knowledge Base", "is_superadmin_only": False},
]

knowledge_document_management_permissions = [
    {"code": "add-document", "name": "Add Document", "submodule_name": "Document Management", "module_name": "Knowledge Base", "is_superadmin_only": False},
    {"code": "view-document", "name": "View Document", "submodule_name": "Document Management", "module_name": "Knowledge Base", "is_superadmin_only": False},
    {"code": "edit-document", "name": "Edit Document", "submodule_name": "Document Management", "module_name": "Knowledge Base", "is_superadmin_only": False},
    {"code": "delete-document", "name": "Delete Document", "submodule_name": "Document Management", "module_name": "Knowledge Base", "is_superadmin_only": False},
]

knowledge_sandbox_permissions = [
    {"code": "view-sandbox", "name": "View Sandbox", "submodule_name": "Sandbox", "module_name": "Knowledge Base", "is_superadmin_only": False},
]

knowledge_settings_permissions = [
    {"code": "view-general-settings", "name": "View General Settings", "submodule_name": "Knowledge Settings", "module_name": "Knowledge Base", "is_superadmin_only": False},
    {"code": "view-advanced-settings", "name": "View Advanced Settings", "submodule_name": "Knowledge Settings", "module_name": "Knowledge Base", "is_superadmin_only": False},
    {"code": "edit-general-settings", "name": "Edit General Settings", "submodule_name": "Knowledge Settings", "module_name": "Knowledge Base", "is_superadmin_only": False},
    {"code": "edit-advanced-settings", "name": "Edit Advanced Settings", "submodule_name": "Knowledge Settings", "module_name": "Knowledge Base", "is_superadmin_only": False},
]

knowledge_api_service_permissions = [
    {"code": "view-api-documentation", "name": "View API Documentation", "submodule_name": "API Service", "module_name": "Knowledge Base", "is_superadmin_only": True},
    {"code": "create-knowledge-api-key", "name": "Create API Key", "submodule_name": "API Service", "module_name": "Knowledge Base", "is_superadmin_only": True},
    {"code": "delete-knowledge-api-key", "name": "Delete API Key", "submodule_name": "API Service", "module_name": "Knowledge Base", "is_superadmin_only": True},
]

# 3. Account Management 
account_group_management_permissions = [
    {"code": "create-group", "name": "Create Group", "submodule_name": "Group Management", "module_name": "Account Management", "is_superadmin_only": True},
    {"code": "view-group", "name": "View Group", "submodule_name": "Group Management", "module_name": "Account Management", "is_superadmin_only": False},
    {"code": "edit-group", "name": "Edit Group", "submodule_name": "Group Management", "module_name": "Account Management", "is_superadmin_only": False},
    {"code": "delete-group", "name": "Delete Group", "submodule_name": "Group Management", "module_name": "Account Management", "is_superadmin_only": True},
]

account_role_and_permission_management_permissions = [
    {"code": "create-role-and-permission", "name": "Create Role and Permission", "submodule_name": "Roles and Permission Management", "module_name": "Account Management", "is_superadmin_only": False},
    {"code": "view-role-and-permission", "name": "View Role and Permission", "submodule_name": "Roles and Permission Management", "module_name": "Account Management", "is_superadmin_only": False},
    {"code": "edit-role-and-permission", "name": "Edit Role and Permission", "submodule_name": "Roles and Permission Management", "module_name": "Account Management", "is_superadmin_only": False},
    {"code": "delete-role", "name": "Delete Role", "submodule_name": "Roles and Permission Management", "module_name": "Account Management", "is_superadmin_only": False},
]

account_group_member_management_permissions = [
    {"code": "add-group-member", "name": "Add Group Member", "submodule_name": "Group Member Management", "module_name": "Account Management", "is_superadmin_only": False},
    {"code": "view-group-member", "name": "View Group Member", "submodule_name": "Group Member Management", "module_name": "Account Management","is_superadmin_only": False},
    {"code": "edit-group-member", "name": "Edit Group Member", "submodule_name": "Group Member Management", "module_name": "Account Management", "is_superadmin_only": False},
    {"code": "delete-group-member", "name": "Delete Group Member", "submodule_name": "Group Member Management", "module_name": "Account Management", "is_superadmin_only": False},
]

# 4. Settings 
settings_model_provider_management_permissions = [
    {"code": "add-model", "name": "Add Model", "submodule_name": "Model Management", "module_name": "Settings", "is_superadmin_only": True},
    {"code": "view-model", "name": "View Model", "submodule_name": "Model Management", "module_name": "Settings", "is_superadmin_only": True},
    {"code": "edit-model", "name": "Edit Model", "submodule_name": "Model Management", "module_name": "Settings", "is_superadmin_only": True},
    {"code": "delete-model", "name": "Delete Model", "submodule_name": "Model Management", "module_name": "Settings", "is_superadmin_only": True},
]

settings_data_source_management_permissions = [
    {"code": "add-data-source", "name": "Add Data Source", "submodule_name": "Data Source Management", "module_name": "Settings", "is_superadmin_only": True},
    {"code": "view-data-source", "name": "View Data Source", "submodule_name": "Data Source Management", "module_name": "Settings", "is_superadmin_only": True},
    {"code": "delete-data-source", "name": "Delete Data Source", "submodule_name": "Data Source Management", "module_name": "Settings", "is_superadmin_only": True},
]

settings_api_extension_management_permissions = [
    {"code": "add-api-extension", "name": "Add API Extension", "submodule_name": "API Extension Management", "module_name": "Settings", "is_superadmin_only": True},
    {"code": "view-api-extension", "name": "View API Extension", "submodule_name": "API Extension Management", "module_name": "Settings", "is_superadmin_only": True},
    {"code": "edit-api-extension", "name": "Edit API Extension", "submodule_name": "API Extension Management", "module_name": "Settings", "is_superadmin_only": True},
    {"code": "delete-api-extension", "name": "Delete API Extension", "submodule_name": "API Extension Management", "module_name": "Settings", "is_superadmin_only": True},
]

application_permissions = [
    application_management_permissions, 
    application_orchestration_permissions, 
    application_logs_and_annotation_permissions,
    application_monitoring_site_management_permissions,
    application_monitoring_api_service_permissions, 
    application_performance_analysis_permissions
]

knowledge_permissions = [
    knowledge_base_management_permissions, knowledge_document_management_permissions,
    knowledge_sandbox_permissions,
    knowledge_settings_permissions,
    knowledge_api_service_permissions
]

account_permissions = [
    account_group_management_permissions,
    account_role_and_permission_management_permissions,
    account_group_member_management_permissions
]

settings_permissions = [
    settings_model_provider_management_permissions,
    settings_data_source_management_permissions,
    settings_api_extension_management_permissions
]

def main():
    seed_permissions(application_permissions)
    seed_permissions(knowledge_permissions)
    seed_permissions(account_permissions)
    seed_permissions(settings_permissions)

if __name__ == "__main__":
    main()