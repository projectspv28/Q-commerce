'use client'

import React, { useEffect, useMemo } from 'react'

interface ILocation {
    latitude: number
    longitude: number
}
interface Iprops {
    userLocation: ILocation
    deliveryBoyLocation: ILocation
}

// Avoid server-side window access by requiring leaflet/react-leaflet only on client
function LiveMap({ userLocation, deliveryBoyLocation }: Iprops) {
    const isClient = typeof window !== 'undefined'

    const L = useMemo(() => {
        if (!isClient) return null
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('leaflet')
    }, [isClient])

    const RL = useMemo(() => {
        if (!isClient) return null
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('react-leaflet')
    }, [isClient])

    if (!isClient || !L || !RL) return null

    const { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } = RL

    function Recenter({ positions }: { positions: [number, number] }) {
        const map = useMap()
        useEffect(() => {
            if (positions[0] !== 0 && positions[1] !== 0) {
                map.setView(positions, map.getZoom(), {
                    animate: true
                })
            }
        }, [positions, map])
        return null
    }

    const deliveryBoyIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/128/9561/9561688.png",
        iconSize: [45, 45]
    })
    const userIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/128/4821/4821951.png",
        iconSize: [45, 45]
    })

    const linePositions =
        deliveryBoyLocation && userLocation
            ? [
                [userLocation.latitude, userLocation.longitude],
                [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]

            ] : []
    const center = deliveryBoyLocation
        ? [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]
        : [userLocation.latitude, userLocation.longitude];


    return (
        <div className='w-full h-[500px] rounded-xl overflow-hidden shadow relative z-2'>
            <MapContainer center={center as any} zoom={13} scrollWheelZoom={true} className="w-full h-full">
                <Recenter positions={center as any} />
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                    <Popup>delivery Address</Popup>
                </Marker>

                {deliveryBoyLocation && <Marker position={[deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]} icon={deliveryBoyIcon}>
                    <Popup>delivery Boy</Popup>
                </Marker>}
                <Polyline positions={linePositions as any} color='green' />
            </MapContainer>
        </div>
    )
}

export default LiveMap
