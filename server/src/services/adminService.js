const User = require('../models/User');
const { ProviderProfile } = require('../models/ProviderProfile');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  const stats = await User.aggregate([
    { $match: { role: 'provider' } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };

  stats.forEach(stat => {
    if (result[stat._id] !== undefined) {
      result[stat._id] = stat.count;
      result.total += stat.count;
    }
  });

  return result;
};

/**
 * Get paginated list of providers with search and filters
 */
const getProviders = async (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10)); // Bound limit max 100
  const skip = (page - 1) * limit;

  // Build match for User collection
  const match = { role: 'provider' };
  
  if (query.status) {
    match.status = query.status;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // Safe regex
    match.$or = [
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } }
    ];
  }

  // Pipeline array
  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'providerprofiles', // Default lowercase plural of ProviderProfile
        localField: '_id',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    {
      $unwind: {
        path: '$profile',
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  // If category filter is provided, add an additional match stage
  if (query.category) {
    pipeline.push({
      $match: {
        'profile.categories': query.category
      }
    });
  }

  // Count total documents matching pipeline
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await User.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Fetch paginated documents
  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });
  
  // Project necessary fields securely
  pipeline.push({
    $project: {
      password: 0,
      __v: 0,
      'profile.__v': 0
    }
  });

  const providers = await User.aggregate(pipeline);

  return {
    providers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get full details of a specific provider
 */
const getProviderDetail = async (id) => {
  // Find the user safely, excluding password completely
  const user = await User.findOne({ _id: id, role: 'provider' }).select('-password');
  
  if (!user) {
    return null;
  }

  const profile = await ProviderProfile.findOne({ userId: id });

  return {
    user,
    profile
  };
};

module.exports = {
  getDashboardStats,
  getProviders,
  getProviderDetail
};
