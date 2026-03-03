import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import Mapbox, {
  MapView,
  Camera,
  ShapeSource,
  LineLayer,
  CircleLayer,
} from '@rnmapbox/maps';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { MAPBOX_PUBLIC_TOKEN } from '../config/runtime';

if (MAPBOX_PUBLIC_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
}

type MapProps = {
  patientCoordinate: [number, number];
  responderCoordinate: [number, number];
  routeCoordinates?: [number, number][];
  showUserLocation?: boolean;
  followUser?: boolean;
};

const Map = ({
  patientCoordinate,
  responderCoordinate,
  routeCoordinates,
  showUserLocation,
  followUser,
}: MapProps) => {
  const hasMapToken = Boolean(MAPBOX_PUBLIC_TOKEN);
  const [userCoord, setUserCoord] = useState<[number, number] | null>(null);
  const routeShape = useMemo<FeatureCollection<LineString>>(
    () => ({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates && routeCoordinates.length > 1
              ? routeCoordinates
              : [responderCoordinate, patientCoordinate],
          },
          properties: {},
        } as Feature<LineString>,
      ],
    }),
    [patientCoordinate, responderCoordinate, routeCoordinates],
  );

  const pointsShape = useMemo<FeatureCollection<Point>>(
    () => ({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: responderCoordinate,
          },
          properties: { role: 'responder' },
        } as Feature<Point>,
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: patientCoordinate,
          },
          properties: { role: 'patient' },
        } as Feature<Point>,
      ],
    }),
    [patientCoordinate, responderCoordinate],
  );

  const bounds = useMemo(() => {
    const lons = [patientCoordinate[0], responderCoordinate[0]];
    const lats = [patientCoordinate[1], responderCoordinate[1]];
    return {
      ne: [Math.max(...lons), Math.max(...lats)] as [number, number],
      sw: [Math.min(...lons), Math.min(...lats)] as [number, number],
      padding: 50,
    };
  }, [patientCoordinate, responderCoordinate]);

  const cameraCenter: [number, number] =
    followUser && userCoord ? userCoord : responderCoordinate;

  return (
    <View style={styles.container}>
      {hasMapToken ? (
        <MapView
          styleURL="mapbox://styles/mapbox/satellite-streets-v12"
          style={styles.map}
          projection="globe"
          logoPosition={Platform.OS === 'android' ? { bottom: 40, left: 10 } : undefined}
          attributionPosition={Platform.OS === 'android' ? { bottom: 40, right: 10 } : undefined}
        >
          <Camera
            bounds={followUser && userCoord ? undefined : bounds}
            centerCoordinate={cameraCenter}
            zoomLevel={12}
            animationDuration={0}
          />
          {showUserLocation ? (
            <>
              <Mapbox.UserLocation
                visible
                onUpdate={loc => {
                  const coords = loc?.coords;
                  if (coords && typeof coords.longitude === 'number' && typeof coords.latitude === 'number') {
                    setUserCoord([coords.longitude, coords.latitude]);
                  }
                }}
              />
              <Mapbox.LocationPuck />
            </>
          ) : null}
          <ShapeSource id="route" shape={routeShape}>
            <LineLayer
              id="routeLine"
              style={{
                lineColor: '#F82306',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
          <ShapeSource id="points" shape={pointsShape}>
            <CircleLayer
              id="pointsCircle"
              style={{
                circleRadius: 6,
                circleColor: [
                  'match',
                  ['get', 'role'],
                  'patient',
                  '#C11717',
                  '#1A9CFF',
                ],
                circleStrokeWidth: 2,
                circleStrokeColor: '#FFFFFF',
              }}
            />
          </ShapeSource>
        </MapView>
      ) : (
        <View style={styles.mapUnavailable}>
          <Text style={styles.mapUnavailableText}>
            Map is unavailable. Set a valid MAPBOX_PUBLIC_TOKEN in app runtime config.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  mapUnavailable: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  mapUnavailableText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default Map;
