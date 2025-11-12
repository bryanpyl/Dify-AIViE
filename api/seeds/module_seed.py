from app_factory import create_app
from extensions.ext_database import db
from models import Module

app = create_app()
def seed_module(modules):
    with app.app_context():
        for module in modules:
            existing_module = db.session.query(Module).filter_by(name=module).first()
            if existing_module:
                print(f'Module {module} already exist. Skipping...')
            else:
                new_module= Module(name=module)
                db.session.add(new_module)
                db.session.commit()
                print(f'Module {module} successfully seeded')
        
module_list = ['Studio', 'Knowledge Base', 'Account Management', 'Settings'] 

def main():
    with app.app_context():
        seed_module(module_list)
    
if __name__ == '__main__':
    main()