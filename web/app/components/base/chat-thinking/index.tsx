import React from "react";
import { useTranslation } from "react-i18next";
const ChatThinking = ({app_agent}:{app_agent:string})=> {
    const {t}= useTranslation()
    return (
        <div className="my-1 flex items-center border-l border-l-gray-300 pl-2 w-full">
        <p className="!mb-0 animate-blink system-xs-semibold bg-gradient-to-r from-primary-700 to-teal-600 bg-clip-text text-transparent">
            {app_agent}{(" ")}{t('share.chat.thinking')}
        </p>
        </div>
    );
};

export default React.memo(ChatThinking);
