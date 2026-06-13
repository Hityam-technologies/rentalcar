const Car = require('../../shared/models/car.model');
const SpecialOffer = require('../../shared/models/specialOffer.model');
const Banner = require('../../shared/models/banner.model');
const { formatCarListItem } = require('../../shared/utils/carFormatter.util');

const DEFAULT_OFFERS = [
  { title: 'Weekend Special', subtitle: '20% off SUVs', gradient: ['#4F46E5', '#7C3AED'], tag: 'HOT', icon: 'car-sport', accentColor: '#7C3AED' },
  { title: 'First Ride Free', subtitle: 'Insurance included', gradient: ['#059669', '#10B981'], tag: 'NEW', icon: 'shield-checkmark', accentColor: '#10B981' },
];

const DEFAULT_BANNERS = [
  { title: 'Fully Insured Rentals', subtitle: 'Drive with peace of mind', ctaLabel: 'Learn More' },
];

const getHomeFeed = async (user) => {
  const [featuredCars, offers, banners] = await Promise.all([
    Car.find({ isFeatured: true, isAvailable: true }).limit(6).sort({ rating: -1 }),
    SpecialOffer.find({ isActive: true }).sort({ sortOrder: 1 }).limit(5),
    Banner.find({ isActive: true }).sort({ sortOrder: 1 }).limit(3),
  ]);

  let famousFleet = featuredCars;
  if (!famousFleet.length) {
    famousFleet = await Car.find({ isAvailable: true }).limit(6).sort({ rating: -1 });
  }

  const offerData = offers.length
    ? offers.map((o) => ({ id: o._id, title: o.title, subtitle: o.subtitle, gradient: o.gradient, tag: o.tag, icon: o.icon, accentColor: o.accentColor }))
    : DEFAULT_OFFERS.map((o, i) => ({ id: `default-${i}`, ...o }));

  const bannerData = banners.length
    ? banners.map((b) => ({ id: b._id, title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, ctaLabel: b.ctaLabel }))
    : DEFAULT_BANNERS.map((b, i) => ({ id: `banner-${i}`, ...b }));

  return {
    userInfo: user
      ? {
          avatarUrl: user.avatarUrl,
          location: user.location?.label || `${user.location?.city || 'New York'}, ${user.location?.country || 'USA'}`,
          notificationCount: user.notificationCount || 0,
        }
      : null,
    aiConcierge: {
      isLive: true,
      contextString: 'Which car is the fastest here?',
    },
    specialOffers: offerData,
    famousFleet: famousFleet.map(formatCarListItem),
    highlightedBanner: bannerData[0] || DEFAULT_BANNERS[0],
    banners: bannerData,
  };
};

module.exports = { getHomeFeed };
