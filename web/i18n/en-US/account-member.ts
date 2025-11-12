const translation = {
    operation:{
        addMember:{
            title:"Add Group Member",
            subtitle:"Group members can access to the application with the role granted"
        },
        addSystemOperator:{
            title:"Add System Operator",
            subtitle:"Invite system operator on board to manage the platform",
        },
        editGroupMember:{
            title:"Edit Group Member",
            subtitle:"Update group member's detail"
        },
        viewSystemUserDetail:{
            title:'View System User',
            subtitle:"Overview of system user account detail"
        },
        fields:{
            emailAddress:{
                groupMembers:{
                    title:"Email Address",
                    subtitle:"Invite the group member(s) via email address",
                },
                systemOperator:{
                    title:"Email Address",
                    subtitle:"Invite the system operator(s) via email address",
                },
                groupMember:{
                    title:"Email Address",
                    subtitle:"Group Member's email addsress"
                },
                placeholder:"e.g. example@domain.com.my"
            },
            groupSelection:{
                title:"Add to Group",
                subtitle:"Select a group to invite the member(s) to",
                placeholder:"Select a group"
            },

            roleSelection:{
                titleForSingleMember:"Member will be invited as",
                titleForMultipleMember:"Member will be invited as",
                actionBtnLabel:"Select Role"
            },
            username:{
                title:"Username",
                subtitle:"Provide a unique username to the member",
                placeholder:"Please enter a valid username"
                // subtitle:""
            },
            editRoleSelection:{
                title:"Member is currently an",
                actionBtnLabel:"Switch Role"
            },
            error:{
                groupMember:"Please select a group",
            }
        },
    }
}

export default translation
