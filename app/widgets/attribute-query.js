"use client";

import { useState, useRef, useEffect } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import useStateStore from "../stateManager";
import { useTranslation } from "react-i18next";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export default function AttributeQueryComponent() {
  const { t } = useTranslation();
  const [
    layerSelector,
    fieldSelector,
    operatorSelector,
    inputTypeSelector,
    insertedQueryValue,
    selectedQueryValue,
  ] = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Zustand state management
  const view = useStateStore((state) => state.targetView);
  // const layers = useStateStore((state) => state.layers);
  const addMessage = useStateStore((state) => state.addMessage);
  const [featureTable, setFeatureTable] = useState(null);
  
  const [state, setState] = useState({
    targetLayer: null,
    queryResultLayer: null,
    resultLayerParameters: null,
    fieldsNames: [],
    layersArray: [],
    inputMethod: "manual",
    downloadBtnDisabled: true,
    allFeatures: [],
    activeListener: false,
    graphicsLayer: null, // Added empty graphic layer parameter
  });

  const supportedLayerTypes = ["csv", "feature", "geojson", "map-image"];

  useEffect(() => {
    if(view)
      {
      console.log("view", view.map.layers.items)
      setState({ ...state, layersArray: view.map.layers.items, activeListener: true });
    }
  }, [view]);

  function prepareQueryParams(state) {
    const layerIndex = layerSelector.current.value;
    const targetLayer = state.layersArray[layerIndex];
    const fieldsNames = targetLayer.fields.map((field) => field.name);
    const fetchAllFeaturesQuery = {
      outFields: ["*"],
      returnGeometry: false,
      where: "",
    };

    targetLayer.queryFeatures(fetchAllFeaturesQuery)
      .then(function (result) {
        setState({
          ...state,
          targetLayer,
          fieldsNames,
          allFeatures: result.features,
        });
      })
      .catch((error) => {
        addMessage({
          title: t('systemMessages.error.queryError.title'),
          body: t('systemMessages.error.failedToCollectData.body'),
          type: "error",
          duration: 10,
        });
        console.log("Query Error", error);
      });
  }

  function toggleInputMode(state, mode) {
    setState({ ...state, inputMethod: mode });
  }

  function search(state) {
    const queryParams = {
      queryField: fieldSelector.current.value,
      queryOperator: operatorSelector.current.value,
    };
  
    // Get the selected field's type
    const selectedField = state.targetLayer.fields.find(
      (field) => field.name === queryParams.queryField
    );
    const isTextField = selectedField?.type === "string"; // Check if the field is of type text/string
  
    let queryValue =
      state.inputMethod === "manual"
        ? insertedQueryValue.current.value
        : selectedQueryValue.current.value;
  
    // Surround the query value with single quotes if the field is text
    if (isTextField && !queryValue.startsWith("'") && !queryValue.endsWith("'")) {
      queryValue = `'${queryValue}'`;
    }
  
    const queryIsValid = Object.values(queryParams).every((parameter) => {
      if (parameter !== null && parameter !== undefined) return true;
      return false;
    });
  
    queryIsValid
      ? applyQuery()
      : addMessage({
          title: t('systemMessages.error.queryError.title'),
          body: t('systemMessages.error.completeSearchRequirements.body'),
          type: "error",
          duration: 10,
        });
  
    function applyQuery() {
      if (state.queryResultLayer) view.map.remove(state.queryResultLayer);
      const queryExpression =
        queryParams.queryField + queryParams.queryOperator + queryValue;
      const query = {
        outFields: ["*"],
        returnGeometry: true,
        where: queryExpression,
      };
  
      state.targetLayer
        .queryFeatures(query)
        .then(function (response) {
          response.features.length
            ? addQueryResult(response)
            : addMessage({
                title: t('systemMessages.error.queryError.title'),
                body: t('systemMessages.error.noResultsFound.body'),
                type: "error",
                duration: 10,
              });
        })
        .catch((error) => {
          addMessage({
            title: t('systemMessages.error.queryError.title'),
            body: t('systemMessages.error.searchError.body'),
            type: "error",
            duration: 10,
          });
          console.log("Query Error", error);
        });
    }
  }

  function addQueryResult(response) {
    // Remove any existing graphics from the map
    if (state.graphicsLayer) {
      state.graphicsLayer.removeAll();
      view.map.remove(state.graphicsLayer);
  }
    
    // Get the layer view for the target layer
    view.whenLayerView(state.targetLayer).then((layerView) => {
      const objectIds = response.features.map((feature) => feature.attributes[state.targetLayer.objectIdField]);
        // Extract the geometries of the selected features
        const features = response.features;

        layerView.featureEffect = {
          filter: {
              where: `${state.targetLayer.objectIdField} IN (${objectIds.join(",")})`
          },
          excludedEffect: "blur(2px) opacity(50%)" // Dim and blur non-selected features
      };

        // Create a graphics layer to hold the outline graphics
        const graphicsLayer = state.graphicsLayer || new GraphicsLayer({title: "Query Results"});
        view.map.add(graphicsLayer);
        
        // Loop through the selected features and create outline graphics
        features.forEach((feature) => {
          const geometry = feature.geometry;
          
          // Create a graphic with a cyan outline
            const outlineGraphic = new Graphic({
                geometry: geometry,
                symbol: {
                    type: "simple-fill", // For polygon features
                    color: [0, 0, 0, 0], // Transparent fill
                    outline: {
                        color: "cyan",
                        width: "2px"
                    }
                  }
                });
                
                // Add the graphic to the graphics layer
                graphicsLayer.add(outlineGraphic);
              });

              setState((prevState) => ({
                ...prevState,
                graphicsLayer: graphicsLayer, // Store the new graphics layer in state
                queryResult: response.features,
                downloadBtnDisabled: false,
            }));

    // Zoom to the selected features
    view.goTo(response.features);

      // if (featureTable) {
      //   featureTable.destroy(); // Clean up the existing table
      // }
    
        // // Create a new FeatureTable widget
        // const table = new FeatureTable({
        //   view: view,
        //   layer: state.targetLayer,
        //   container: document.createElement("div"), // Create a container for the table
        //   visibleElements: {
        //     menu: false, // Hide the menu
        //     columnMenus: false, // Hide column menus
        //   },
        // });
    
        // // Filter the table to show only the selected features
        // table.filterGeometry = {
        //   type: "multipoint",
        //   points: state.queryResult.map((feature) => feature.geometry),
        // };
    
        // // Add the table to the DOM
        // document.getElementById("attributeTableContainer").appendChild(table.container);
    
        // // Save the table instance in state
        // setFeatureTable(table);
     
  
      // Show a success message
      addMessage({
        type: "info",
        title: t('systemMessages.info.queryCompleted.title'),
        body: `${t('systemMessages.info.queryCompleted.body')} ${state.targetLayer.title}`,
        duration: 10,
      });
  
      // Update the state with the query result
    
    });
  }

  function clearSearch(state) {
    // Clear the feature effect
    view.whenLayerView(state.targetLayer).then((layerView) => {
        layerView.featureEffect = null; // Remove the highlight effect
    });

    // Clear the graphics layer (if it exists)
    if (state.graphicsLayer) {
        state.graphicsLayer.removeAll(); // Remove all graphics from the layer
        view.map.remove(state.graphicsLayer); // Remove the graphics layer from the map
    }

    // Update the state
    setState((prevState) => ({
        ...prevState,
        queryResult: null,
        downloadBtnDisabled: true,
        graphicsLayer: null, // Clear the graphics layer reference
    }));
}

  function CreateSeparateLayer(state) {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    const symbols = {
      point: {
        type: "simple-marker",
        style: "circle",
        color: randomColor,
        size: "8px",
      },
      polyline: {
        type: "simple-line",
        color: randomColor,
        width: 2,
      },
      polygon: {
        type: "simple-fill",
        color: randomColor,
        outline: {
          width: 2,
          color: "#fff",
        },
      },
    };
    const newSymbol = symbols[state.targetLayer.geometryType];

    const renderer = {
      type: "simple",
      symbol: newSymbol,
    };

    const newSelectionLayer = new FeatureLayer(state.resultLayerParameters);
    newSelectionLayer.title = state.targetLayer.title + "_modified_copy";
    newSelectionLayer.renderer = renderer;
    view.map.layers.add(newSelectionLayer);
  }

  return (
    <div className="flex flex-col space-y-4 p-4 text-white">
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="layerSelector" className="font-semibold">
          {t('widgets.query.selectLayer')}
        </label>
        <select
          ref={layerSelector}
          id="layerSelector"
          className="p-1 border border-gray-300 rounded-sm focus:outline-none focus:border-primary transition-all duration-300 w-full"
          onChange={() => prepareQueryParams(state)}
        >
          <option value="" hidden>
            {t('widgets.query.select')}
          </option>
          {state.layersArray.map((layer, index) => {
            if (supportedLayerTypes.includes(layer.type)) {
              return (
                <option key={layer.id} value={index}>
                  {layer.title}
                </option>
              );
            }
          })}
        </select>
      </div>
  
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="fieldSelector" className="font-semibold">
          {t('widgets.query.selectField')}
        </label>
        <select
          ref={fieldSelector}
          id="fieldSelector"
          className="p-1 border border-gray-300 rounded-sm focus:outline-none focus:border-primary transition-all duration-300 w-full"
        >
          <option value="" hidden>
            {t('widgets.query.select')}
          </option>
          {state.fieldsNames.map((fieldName, index) => {
            return (
              <option key={index} value={fieldName}>
                {fieldName}
              </option>
            );
          })}
        </select>
      </div>
  
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="operatorSelector" className="font-semibold">
          {t('widgets.query.selectQueryCondition')}
        </label>
        <select
          ref={operatorSelector}
          id="operatorSelector"
          className="p-1 border border-gray-300 rounded-sm focus:outline-none focus:border-primary transition-all duration-300 w-full"
        >
          <option value="=">{t('widgets.query.equals')}</option>
          <option value=">">{t('widgets.query.greaterThan')}</option>
          <option value="<">{t('widgets.query.lessThan')}</option>
        </select>
      </div>
  
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="inputTypeSelector" className="font-semibold">
          {t('widgets.query.selectInputType')}
        </label>
        <select
          ref={inputTypeSelector}
          id="inputTypeSelector"
          onChange={() => toggleInputMode(state, inputTypeSelector.current.value)}
          className="p-1 border border-gray-300 rounded-sm focus:outline-none focus:border-primary transition-all duration-300 w-full"
        >
          <option value={"manual"}>{t('widgets.query.manualInput')}</option>
          <option value={"from data"}>{t('widgets.query.fromData')}</option>
        </select>
      </div>
  
      {state.inputMethod === "manual" ? (
        <div className="flex flex-col space-y-2 w-full">
          <label htmlFor="queryInput" className="font-semibold">
            {t('widgets.query.enterValue')}
          </label>
          <input
            ref={insertedQueryValue}
            type="text"
            id="queryInput"
            className="p-1 border border-gray-300 rounded-sm focus:outline-none focus:border-primary transition-all duration-300 w-full"
          />
        </div>
      ) : (
        <div className="flex flex-col space-y-2 w-full">
          <label htmlFor="queryValues" className="font-semibold">
            {t('widgets.query.selectValue')}
          </label>
          <select
            ref={selectedQueryValue}
            id="queryValues"
            className="p-1 border border-gray-300 rounded-sm focus:outline-none focus:border-primary transition-all duration-300 w-full"
          >
            <option value="" hidden>
              {t('widgets.query.select')}
            </option>
            {state.allFeatures.map((feature, index) => {
              const targetField = fieldSelector.current.value;
              if (feature.attributes[targetField] !== null)
                return (
                  <option key={index} value={feature.attributes[targetField]}>
                    {feature.attributes[targetField]}
                  </option>
                );
            })}
          </select>
        </div>
      )}
  
      <div className="flex space-x-2 w-full">
        <button
          className="flex-grow p-2 bg-primary text-white rounded-sm hover:bg-primary-dark transition-all duration-200 text-center"
          onClick={() => search(state)}
        >
          {t('widgets.query.search')}
        </button>
        <button
          className="p-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-all duration-200 text-center"
          onClick={() => clearSearch(state)}
        >
          {t('widgets.query.clearSearch')}
        </button>
      </div>
      <div className="flex space-x-2 w-full">
        <button
          className="flex-grow p-2 bg-green-500 text-white rounded-sm hover:bg-green-600 transition-all duration-200 text-center"
          disabled={state.downloadBtnDisabled}
          onClick={() => CreateSeparateLayer(state)}
        >
          {t('widgets.query.createNewLayer')}
        </button>
      </div>
    </div>
  );
}