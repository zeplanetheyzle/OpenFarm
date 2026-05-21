--센서데이터 테이블 생성
create table sensor_data (

    id bigint generated always as identity primary key,

    crop_type text,

    device_id text,

    created_at timestamp with time zone default now(),

    temperature float,

    humidity float,

    co2 float,

    growth_status text
);

insert into sensor_data
(
    crop_type,
    device_id,
    temperature,
    humidity,
    co2,
    growth_status,
    created_at
)

select

    (array['tomato', 'lettuce', 'carrot'])
    [floor(random() * 3 + 1)],

    (array['01', '02', '03'])
    [floor(random() * 3 + 1)],

    round(
        (random() * (30.0 - 18.0) + 18.0)::numeric,
        1
    ),

    round(
        (random() * (80.0 - 40.0) + 40.0)::numeric,
        1
    ),

    round(
        (random() * (1000 - 400) + 400)::numeric,
        0
    ),

    'https://phrdjackllrrkwtwgkuz.supabase.co/storage/v1/object/public/test-images/plants01.jpeg',

    now() - (generate_series * interval '1 hour')

from generate_series(1, 7);