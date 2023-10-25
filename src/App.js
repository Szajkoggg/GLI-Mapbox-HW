import "./App.css";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import React, { useRef, useEffect, useState, useCallback } from "react";
import BottomBar from "./components/BottomBar";

// mapboxgl.accessToken = process.env.MAPBOX_TOKEN;
mapboxgl.accessToken =
  "pk.eyJ1IjoidGVsZWdhYmVlIiwiYSI6ImNsbzAxem5oNTE5aHUya3FvenJ5aDhvajQifQ.pJbZ5JB93qYW77V7sSPxQw";

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(17.905);
  const [lat, setLat] = useState(47.095);
  const [directionMarkers, setDirectionMarkers] = useState([]);
  const [zoom, setZoom] = useState(13);
  const [markers, setMarkers] = useState([]);
  const [routeColor, setRouteColor] = useState("#ff0000");
  const [lineWidth, setLineWidth] = useState(4);
  const [routeLength, setRouteLength] = useState(null);
  const [routeTime, setRouteTime] = useState(null);
  const [markerNumbers] = useState([]);
  const [numberMarkers, setNumberMarkers] = useState([]);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("click", (e) => {
      const clickedLng = e.lngLat.lng;
      const clickedLat = e.lngLat.lat;
      addMarker([clickedLng, clickedLat]);
    });

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: "Search for a location",
      marker: false,
    });

    geocoder.on("result", (event) => {
      if (event.result && event.result.center) {
        const [lng, lat] = event.result.center;
        addMarker([lng, lat]);
      }
    });
    map.current.addControl(geocoder, "top-left");
  });

  const handleColorChange = (color) => {
    setRouteColor(color.hex);
    const existingRouteLayer = map.current.getLayer("custom-route");
    if (existingRouteLayer) {
      map.current.setPaintProperty("custom-route", "line-color", color.hex);
    }
  };

  const handleLineWidthChange = (event) => {
    const newWidth = parseInt(event.target.value, 10);
    setLineWidth(parseInt(event.target.value, 10));
    const existingRouteLayer = map.current.getLayer("custom-route");
    if (existingRouteLayer) {
      map.current.setPaintProperty("custom-route", "line-width", newWidth);
    }
  };

  const handleDeleteMarker = (index) => {
    const id = markers[index].id;
    setDirectionMarkers((prevDirectionMarkers) => {
      const updatedDirectionMarkers = [...prevDirectionMarkers];
      const index = directionMarkers.findIndex((marker) => marker.id === id);
      if (index > -1) {
        updatedDirectionMarkers.splice(
          directionMarkers.findIndex((marker) => marker.id === id),
          1
        );
      }

      return updatedDirectionMarkers;
    });

    const mapMarker = markers[index];
    if (mapMarker) {
      mapMarker.marker.remove();
    }
    const mapNumberMarker = numberMarkers[index];
    if (mapNumberMarker) {
      mapNumberMarker.marker.remove();
    }

    markerNumbers.splice(index, 1);

    const updatedMarkers = [...markers];
    updatedMarkers.splice(index, 1);
    setMarkers(updatedMarkers);

    const updatedNumberMarkers = [...numberMarkers];
    updatedNumberMarkers.splice(index, 1);
    setNumberMarkers(updatedNumberMarkers);
  };

  const handleSetAsStartpoint = (index) => {
    setDirectionMarkers((prevDirectionMarkers) => {
      const updatedDirectionMarkers = [...prevDirectionMarkers];
      updatedDirectionMarkers[0] = markers[index];
      return updatedDirectionMarkers;
    });
  };

  const handleSetAsEndpoint = (index) => {
    setDirectionMarkers((prevDirectionMarkers) => {
      const updatedDirectionMarkers = [...prevDirectionMarkers];
      if (updatedDirectionMarkers.length > 1) {
        updatedDirectionMarkers[updatedDirectionMarkers.length - 1] =
          markers[index];
      } else {
        updatedDirectionMarkers[1] = markers[index];
      }
      return updatedDirectionMarkers;
    });
  };

  const handleFetchDirections = () => {
    if (directionMarkers.length < 2) {
      setRouteLength(null);
      setRouteTime(null);
      if (map.current) {
        removeRouteLayer();
      }
      return;
    }
    const origin = [directionMarkers[0].lng, directionMarkers[0].lat];
    const destination = [
      directionMarkers[directionMarkers.length - 1].lng,
      directionMarkers[directionMarkers.length - 1].lat,
    ];
    const waypoints = directionMarkers.slice(1, directionMarkers.length - 1);

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin}${
      waypoints.length > 0 ? ";" + waypoints.join(";") : ""
    };${destination}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${
      mapboxgl.accessToken
    }`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;

        const length = (route.distance / 1000).toFixed(2);
        const time = (route.duration / 60).toFixed(2);
        setRouteLength(length);
        setRouteTime(time);

        removeRouteLayer();
        addRouteLayer(coordinates);
      });
  };

  const removeRouteLayer = () => {
    if (map.current.getLayer("custom-route")) {
      map.current.removeLayer("custom-route");
    }

    if (map.current.getSource("custom-route")) {
      map.current.removeSource("custom-route");
    }
  };

  const addRouteLayer = (coordinates) => {
    map.current.addSource("custom-route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    });

    map.current.addLayer({
      id: "custom-route",
      type: "line",
      source: "custom-route",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": routeColor,
        "line-width": lineWidth,
      },
    });
  };

  const addMarker = (coordinates) => {
    const newNumber =
      markerNumbers.length > 0 ? Math.max(...markerNumbers) + 1 : 1;
    markerNumbers.push(newNumber);

    const newMarker = {
      id: `marker-${newNumber}`,
      lng: coordinates[0],
      lat: coordinates[1],
      number: newNumber,
      marker: new mapboxgl.Marker().setLngLat(coordinates),
    };
    setMarkers((prevMarkers) => [...prevMarkers, newMarker]);

    newMarker.marker.addTo(map.current);

    const newNumberMarker = {
      lng: coordinates[0],
      lat: coordinates[1],
      number: newNumber,
      marker: createNumberMarkerElement(newNumber, [
        coordinates[0],
        coordinates[1],
      ]),
    };
    setNumberMarkers((prevNumberMarkers) => [
      ...prevNumberMarkers,
      newNumberMarker,
    ]);
    newNumberMarker.marker.addTo(map.current);
  };

  const createNumberMarkerElement = (number, coords) => {
    const markerNumberElement = document.createElement("div");
    markerNumberElement.className = "marker-number";
    markerNumberElement.textContent = number;

    const numberMarker = new mapboxgl.Marker({
      element: markerNumberElement,
    }).setLngLat(coords);

    return numberMarker;
  };

  useEffect(() => {
    handleFetchDirections();
  }, [directionMarkers]);

  return (
    <div>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div ref={mapContainer} className="map-container" />
      <BottomBar
        markerNumbers={markerNumbers}
        markers={markers}
        directionMarkers={directionMarkers}
        onRouteClick={handleFetchDirections}
        onDeleteClick={handleDeleteMarker}
        onSetStartpointClick={handleSetAsStartpoint}
        onSetEndpointClick={handleSetAsEndpoint}
        routeLength={routeLength}
        routeTime={routeTime}
        routeColor={routeColor}
        linewidth={lineWidth}
        onColorPick={handleColorChange}
        onLinePick={handleLineWidthChange}
      />
    </div>
  );
}
