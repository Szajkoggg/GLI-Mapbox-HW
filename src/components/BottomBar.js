import React from "react";
import { SketchPicker } from "react-color";

const BottomBar = ({
  markerNumbers,
  markers,
  directionMarkers,
  onRouteClick,
  onDeleteClick,
  onSetStartpointClick,
  onSetEndpointClick,
  routeLength,
  routeTime,
  routeColor,
  linewidth,
  onColorPick,
  onLinePick,
}) => {
  return (
    <div className="bottom-bar">
      <div className="left-control-panel">
        <div className="marker-list">
          <h2>Markers:</h2>
          <ul>
            {markers.map((marker, index) => (
              <li className="marker-container" key={index}>
                <div>
                  {markerNumbers[index]}. Longitude: {marker.lng.toFixed(2)} |
                  Latitude: {marker.lat.toFixed(2)}
                </div>
                <button
                  className="marker-button"
                  onClick={() => onDeleteClick(index, marker)}
                >
                  Delete
                </button>
                {directionMarkers[0] === marker ? (
                  <button className="marker-button-selected">
                    Route start
                  </button>
                ) : (
                  <button
                    className="marker-button"
                    onClick={() => onSetStartpointClick(index)}
                  >
                    Set as Startpoint
                  </button>
                )}
                {directionMarkers[directionMarkers.length - 1] === marker ? (
                  <button className="marker-button-selected">Route end</button>
                ) : (
                  <button
                    className="marker-button"
                    onClick={() => onSetEndpointClick(index)}
                  >
                    Set as Endpoint
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        {directionMarkers.length > 1 ? (
          <button className="marker-button" onClick={onRouteClick}>
            Create route
          </button>
        ) : (
          <div></div>
        )}

        {routeLength && routeTime && (
          <div>
            <p>Route Length: {routeLength} km</p>
            <p>Route Time: {routeTime} minutes</p>
          </div>
        )}
      </div>

      <div className="right-control-panel">
        <h2>Customize:</h2>
        <SketchPicker
          className="sketch-picker"
          color={routeColor}
          onChangeComplete={onColorPick}
        />
        <div className="line-select-container">
          <label>
            Line Width: &nbsp;
            <select
              className="line-select"
              value={linewidth}
              onChange={onLinePick}
            >
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="6">6</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

export default BottomBar;
