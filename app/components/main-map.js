"use client";

// import Map from "@arcgis/core/Map";
// import MapView from "@arcgis/core/views/MapView";
// import esriConfig from "@arcgis/core/config";
// import dotenv from 'dotenv'
// dotenv.config();
// const ArcGISAPIKey = process.env.NEXT_PUBLIC_ArcGISAPIKey;
import { useAppContext  } from "../context/AppContext"; 

let map,view
const MainMap = () => {
  const { state, dispatch } = useAppContext();
    // console.log(ArcGISAPIKey)

    return (
        <div>
            <h1>Main Map</h1>
        </div>
    );
};

export default MainMap;