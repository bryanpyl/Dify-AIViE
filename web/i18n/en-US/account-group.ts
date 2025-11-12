const translation = {
    overview:{
        title:"Group Overview",
        subtitle:"Manage groups created to access the system",
        create:{
            title:"Create New Group",
            subtitle:"Add a group for an agency where the members can access to respective knowledge and application.",
            operation:{
                create:"Create Group",
                cancel:"Cancel"
            }
        },
        noResult:{
            title:"No result matches your query",
            subtitle:"Try search using other valid keywords"
        }
    },

    fields:{
        groupName:{
            title:"Group Name",
            subtitle:"Please provide a simple name to label the group with",
            placeholder:"Group Name",
        },
        agencyName:{
            title:"Agency Name",
            subtitle:"Agency name in full to indicate the group's agency",
            placeholder:"Agency Name",
        },
        groupDesc:{
            title:"Group Description",
            subtitle:"Introduce what the group is about",
            placeholder:"Group Description",
        },
    },

    detail:{
        title:"Group Management",
        operation:{
            groupSettings:"Group Settings",
            editGroup:{
                title:"Edit Group",
                confirm:"Save Changes",
                cancel:"Cancel",
            },
            deleteGroup:{
                title:"Delete Group",
                subtitle:"Are you sure you want to delete the group?",
            }
        },
    },
    generalInfo:{
        title:"General Information",
    },

    groupBindingsOverview:{
        title:"Group Overview",
        knowledgeBase:{
            title:"Knowledge Base",
            subtitle:"Knowledge base associated to the group",
            knowledgeSelection:{
                titleSuperadmin:"Select Knowledge Base",
                subtitleSuperadmin:"Selected knowledge base will be available for your application use",
                lessThanOneSelectedPrompt:"knowledge selected",
                moreThanOneSelectedPrompt:"knowledges selected",
                searchPlaceholder:"Search Knowledge",
                titleNonSuperadmin:"Knowledge Base",
                subtitleNonSuperadmin:"Knowledge base added to the group",
                viewKnowledge:"View More"
            },
        },
        groupMember:{
            title:"Group Members",
            subtitle:"List of members registered to this group"
        },
        linkedApplication:{
            title:"Linked Application",
            subtitle:"Chat application linked to this group",
            applicationSelection:{
                title:"Select Application",
                subtitle:"Link an application to the group",
                searchPlaceholder:"Search Application",
                invalidApplicationDescription:"SCSChat Application",
            },
        },
    },

    members:{
        title:"Group Members",
        subtitle:"List of members registered to this group",
        operation:{
            removeFromGroup:{
                title:"Remove {{name}} from Group",
                subtitle:"Are you sure you want to remove the member from the group?",
            },
            deleteMember:{
                title:"Delete {{name}}",
                subtitle:"Are you sure you want to delete the member?",
            }
        },
    },

}

export default translation
