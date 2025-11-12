from collections.abc import Mapping, Sequence
from typing import Any 

from core.workflow.entities.node_entities import NodeRunResult
from core.workflow.nodes.base import Node
from core.workflow.nodes.enums import NodeType
from core.workflow.nodes.button_response.entities import ButtonResponseNodeData
from models.workflow import WorkflowNodeExecutionStatus

class ButtonResponseNode(Node):
    _node_data_cls=ButtonResponseNodeData
    _node_type = NodeType.BUTTON_RESPONSE
    
    def _run(self)->NodeRunResult:
        button_data=[]
        
        if self.node_data.button_answers:
            for data in self.node_data.button_answers:
                button_dict = {
                'id': data.id,
                'content': data.content
            }
                button_data.append(button_dict)
                
        return NodeRunResult(
            status=WorkflowNodeExecutionStatus.SUCCEEDED,
            inputs={'response_title':self.node_data.response_title,'button_answers':button_data},
            outputs={'answer':{'response_title':self.node_data.response_title,'button_answers':button_data}}
        )
        
        