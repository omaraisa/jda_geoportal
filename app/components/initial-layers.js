// config/initialLayers.js
export const initialMapLayers = [
    {
      id: null,
      title: 'Jeddah Historical',
      type: 'feature',
      sourceType: 'url', // 'url' | 'portal'
      url: 'https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/JeddahHistorical/FeatureServer', 
      portalItemId: null,
      groups: [],
      visible: true,
      labelsEnabled: true,
      renderer: null,
      opacity: 1,
      minScale: 0,
      maxScale: 18,
    },
    {
      id: null,
      title: 'Parcel',
      type: 'feature',
      sourceType: 'url', // 'url' | 'portal'
      url: 'https://gis.jda.gov.sa/agserver/rest/services/Hosted/Parcel/FeatureServer', 
      portalItemId: null,
      groups: [],
      visible: false,
      labelsEnabled: true,
      renderer:  {
                  type: "simple",
                  symbol: {
                    type: "simple-fill",
                    // White with 50% transparency
                    outline: {
                      color: [255, 255, 0, 1], // Yellow outline
                      width: 1
                    }
                  }
                },
      opacity: 1,
      minScale: 0,
      maxScale: 18,
    }
  ];


  
export const initialSceneLayers = [
        {
      id: null,
      title: 'Parcel',
      type: 'feature',
      sourceType: 'url', // 'url' | 'portal'
      url: 'https://gis.jda.gov.sa/agserver/rest/services/Hosted/Parcel/FeatureServer', 
      portalItemId: null,
      groups: [],
      visible: false,
      labelsEnabled: true,
      renderer: null,
      opacity: 1,
      minScale: 0,
      maxScale: 18,
    }
  ];