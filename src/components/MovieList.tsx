import React, { useState } from 'react';
import { Card, Tag, Button, Badge, Rate } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, MapOutlined, TicketOutlined, StarOutlined } from '@ant-design/icons';

interface Movie {
  id: number;
  title: string;
  poster: string;
  rating: number;
  duration: string;
  theaters: string[];
  showtimes: string[];
  discount: boolean;
  originalPrice: number;
  discountPrice: number;
}

const movies: Movie[] = [
  {
    id: 1,
    title: '复仇者联盟4：终局之战',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Avengers%20Endgame%20movie%20poster%2C%20high%20quality%2C%20cinematic&image_size=portrait_4_3',
    rating: 9.2,
    duration: '181分钟',
    theaters: ['万达影城', 'CGV影城', '大地影院', '星美影城'],
    showtimes: ['10:30', '13:45', '16:00', '19:15', '21:30'],
    discount: true,
    originalPrice: 39.9,
    discountPrice: 9.9
  },
  {
    id: 2,
    title: '流浪地球2',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=The%20Wandering%20Earth%202%20movie%20poster%2C%20sci-fi%2C%20high%20quality&image_size=portrait_4_3',
    rating: 8.5,
    duration: '173分钟',
    theaters: ['万达影城', 'CGV影城', '大地影院'],
    showtimes: ['11:00', '14:15', '17:30', '20:45'],
    discount: true,
    originalPrice: 35.9,
    discountPrice: 9.9
  },
  {
    id: 3,
    title: '满江红',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Full%20River%20Red%20movie%20poster%2C%20historical%20drama%2C%20high%20quality&image_size=portrait_4_3',
    rating: 8.1,
    duration: '159分钟',
    theaters: ['CGV影城', '大地影院', '星美影城'],
    showtimes: ['09:30', '12:45', '15:00', '18:15', '21:30'],
    discount: false,
    originalPrice: 29.9,
    discountPrice: 29.9
  },
  {
    id: 4,
    title: '独行月球',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Moon%20Man%20movie%20poster%2C%20comedy%2C%20space%2C%20high%20quality&image_size=portrait_4_3',
    rating: 7.8,
    duration: '122分钟',
    theaters: ['万达影城', '星美影城'],
    showtimes: ['10:00', '13:15', '16:30', '19:45'],
    discount: true,
    originalPrice: 32.9,
    discountPrice: 9.9
  },
  {
    id: 5,
    title: '深海',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Deep%20Sea%20movie%20poster%2C%20animation%2C%20fantasy%2C%20high%20quality&image_size=portrait_4_3',
    rating: 8.3,
    duration: '112分钟',
    theaters: ['万达影城', 'CGV影城', '大地影院', '星美影城'],
    showtimes: ['10:15', '12:30', '14:45', '17:00', '19:15', '21:30'],
    discount: false,
    originalPrice: 27.9,
    discountPrice: 27.9
  },
  {
    id: 6,
    title: '消失的她',
    poster: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Lost%20in%20the%20Stars%20movie%20poster%2C%20mystery%2C%20thriller%2C%20high%20quality&image_size=portrait_4_3',
    rating: 7.5,
    duration: '121分钟',
    theaters: ['CGV影城', '大地影院'],
    showtimes: ['11:15', '14:30', '17:45', '21:00'],
    discount: true,
    originalPrice: 30.9,
    discountPrice: 9.9
  }
];

const MovieList: React.FC = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
            正在热映
          </h1>
          <p className="text-gray-300 text-lg">
            发现精彩影片，享受9.9元优惠购票
          </p>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((movie) => (
            <Card
              key={movie.id}
              className="bg-gray-800 border-none rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              cover={
                <div className="relative">
                  <img 
                    src={movie.poster} 
                    alt={movie.title} 
                    className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {movie.discount && (
                    <Badge.Ribbon 
                      text="9.9元优惠" 
                      color="red" 
                      className="text-xs font-bold"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-lg">{movie.title}</span>
                      <div className="flex items-center">
                        <StarOutlined className="text-yellow-400 mr-1" />
                        <span className="text-white">{movie.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <div className="space-y-3">
                {/* Duration */}
                <div className="flex items-center text-gray-300">
                  <ClockCircleOutlined className="mr-2 text-amber-500" />
                  <span>{movie.duration}</span>
                </div>

                {/* Theaters */}
                <div>
                  <div className="flex items-center text-gray-300 mb-2">
                    <MapOutlined className="mr-2 text-blue-400" />
                    <span>支持影院</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {movie.theaters.map((theater, index) => (
                      <Tag key={index} className="bg-gray-700 text-gray-200 hover:bg-gray-600">
                        {theater}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* Showtimes */}
                <div>
                  <div className="flex items-center text-gray-300 mb-2">
                    <CalendarOutlined className="mr-2 text-green-400" />
                    <span>今日场次</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {movie.showtimes.map((time, index) => (
                      <Tag key={index} className="bg-gray-700 text-gray-200 hover:bg-gray-600 cursor-pointer">
                        {time}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div>
                    {movie.discount ? (
                      <div className="flex items-center">
                        <span className="text-red-500 font-bold text-xl">¥{movie.discountPrice}</span>
                        <span className="text-gray-400 text-sm line-through ml-2">¥{movie.originalPrice}</span>
                      </div>
                    ) : (
                      <span className="text-white font-bold text-xl">¥{movie.originalPrice}</span>
                    )}
                  </div>
                  <Button 
                    type="primary" 
                    icon={<TicketOutlined />}
                    className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 border-none"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    立即购票
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Discount Banner */}
        <div className="mt-12 bg-gradient-to-r from-red-600 to-amber-500 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">限时优惠</h2>
          <p className="text-white mb-4">部分影片享受9.9元特惠票价，数量有限，先到先得！</p>
          <Button 
            type="primary" 
            className="bg-white text-red-600 hover:bg-gray-100 border-none"
          >
            查看全部优惠
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MovieList;