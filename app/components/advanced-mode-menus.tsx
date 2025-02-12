import React from 'react';

import style from './advanced-mode-menus.module.css';
import useStateStore from "@/stateStore";

const AdvancedModeMenus: React.FC = () => {
  const { sendMessage } = useStateStore((state) => state);

    return (
        <div>
            <div className={style.leftMenu}>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-close ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-home ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-layers ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-globe ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-zoom-in-magnifying-glass ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-zoom-out-magnifying-glass ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-search ${style.icon}`}></i>
            </div>
            <div className={style.rightMenu}>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-settings ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-user ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-globe ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-calendar ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-chart ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-save ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-home ${style.icon}`}></i>
            </div>
            <div className={style.bottomMenu}>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-phone ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-settings ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-refresh ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-save ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-share ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-trash ${style.icon}`}></i>
                <i onClick={()=>sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body!`,
                    type: "info",
                    duration: 10,
                  })} className={`esri-icon-measure ${style.icon}`}></i>
            </div>
        </div>
    );
};

export default AdvancedModeMenus;