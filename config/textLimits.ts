// Text length limits for every text field. The server enforces the same
// numbers (backend/helpers.py TEXT_LIMITS); here they stop typing at the limit.
export const TEXT_LIMITS = {
  firstName: 40,
  lastName: 40,
  email: 254,
  password: 128,
  postTitle: 60,
  postDescription: 1000,
  bio: 300,
  pronouns: 30,
  phone: 20,
  locationName: 40,
  locationDescription: 200,
  message: 500, // questions, answers and reviews
  search: 100,
} as const;
