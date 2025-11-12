from app_factory import create_app
from extensions.ext_database import db
from models import Module, SubModule

app = create_app()

def seed_submodule(submodules):
    with app.app_context():
        for submodule,desc, module in submodules:
            existing_module = db.session.query(Module).filter_by(name=module).first()
            if existing_module:
                existing_submodule = db.session.query(SubModule).filter_by(name=submodule,module_id=existing_module.id).first()
                if existing_submodule:
                    print(f'Submodule {submodule} already exists. Skipping...')
                else:
                    new_submodule = SubModule(name=submodule, description=desc, module_id=existing_module.id)
                    db.session.add(new_submodule)
                    db.session.commit()
                    print(f'Submodule {submodule} successfully seeded.')
            else:
                print(f'Module {module} does not exist. Skipping...')       
    

submodules_list = [
    ('Application Management', 'Management of the applications in the studio', 'Studio'),
    ('Application Orchestration', 'Orchestration management of the existing applications in the studio', 'Studio'),
    ('Logs and Annotation', 'Record of application interactions and fine-tuning of application response through annotation', 'Studio'),
    ('Site Management', 'Management of chat platform of the application', 'Studio'),
    ('API Service', 'Backend service of the application', 'Studio'),
    ('Performance Monitoring', 'Dashboard of application\'s performance of a specific timeframe', 'Studio'),
    
    ('Knowledge Management', 'Management of the existing knowledge base created', 'Knowledge Base'),
    ('Document Management', 'Management of documents uploaded to the knowledge base', 'Knowledge Base'),
    ('Sandbox', 'Debugging panel to test out the knowledge in GPT-like response', 'Knowledge Base'),
    ('Knowledge Settings', 'Configuration of the knowledge base', 'Knowledge Base'),
    ('API Service', 'Backend service of the knowledge base', 'Knowledge Base'),
    
    ('Group Management', 'Management of group', 'Account Management'),
    ('Roles and Permission Management', 'Role and permission management of the default role and custom role (if any)', 'Account Management'),
    ('Group Member Management', 'Management of member assigned to the group', 'Account Management'),
    
    ('Model Management', 'Configurations of model provider and its respective models', 'Settings'),
    ('Data Source Management', 'External data source configuration', 'Settings'),
    ('API Extension Management', 'Management of API extension settings', 'Settings'),
]

def main(): 
    with app.app_context():
        seed_submodule(submodules_list)

if __name__ == '__main__':
    main()