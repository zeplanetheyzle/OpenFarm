interface DeviceInfo {
  device_id: string
  location: string
  size: string
  created_at: string
}

interface Props {
  cropType: string
  devices: DeviceInfo[]
  onSelect: (deviceId: string) => void
}

export default function CropSelection({ cropType, devices, onSelect }: Props) {
  if (devices.length === 0) {
    return (
      <div className="mt-16 text-center text-gray-400">
        <div className="text-5xl mb-4">🌱</div>
        <p className="text-xl">등록된 스마트팜이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="mt-16">
      <div className="flex justify-center gap-10 flex-wrap">
        {devices.map(device => (
          <div
            key={device.device_id}
            onClick={() => onSelect(device.device_id)}
            className="w-72 h-96 bg-white border-4 border-orange-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition duration-300"
          >
            <h1 className="text-5xl font-bold text-orange-400">
              {cropType}
            </h1>
            <div className="w-48 border-b-2 border-orange-300 my-6" />
            <div className="text-2xl font-bold leading-[50px] text-center px-4">
              <p>#{device.device_id}</p>
              <p>#{new Date(device.created_at).getFullYear()}</p>
              <p>#{device.location}</p>
              <p>#{device.size || "Small"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}