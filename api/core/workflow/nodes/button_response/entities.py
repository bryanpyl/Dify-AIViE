from typing import Optional 

from pydantic import BaseModel

from core.workflow.nodes.base import BaseNodeData

class ButtonResponseConfig (BaseModel):
    id: str=1
    content:str=""
    
class ButtonResponseNodeData(BaseNodeData):
    button_answers:list[ButtonResponseConfig]
    response_title:Optional[str]