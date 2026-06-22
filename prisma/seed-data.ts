export const FIRST_NAMES_MALE = [
  "Aarav", "Vihaan", "Aditya", "Arjun", "Rohan", "Karan", "Vikram", "Rahul",
  "Siddharth", "Ishaan", "Kabir", "Aryan", "Dhruv", "Yash", "Rishi", "Aniket",
  "Pranav", "Shaurya", "Veer", "Rudra", "Kunal", "Akshay", "Nikhil", "Tarun",
  "Manish", "Sandeep", "Ramesh", "Harsh", "Aditya", "Saurabh",
];

export const FIRST_NAMES_FEMALE = [
  "Ananya", "Aanya", "Diya", "Priya", "Neha", "Pooja", "Riya", "Kavya",
  "Sneha", "Anjali", "Meera", "Ishita", "Aarohi", "Tanvi", "Saanvi", "Aditi",
  "Sara", "Myra", "Avni", "Ira", "Nandini", "Shreya", "Pranjal", "Vidya",
  "Lakshmi", "Rhea", "Anushka", "Trisha", "Esha", "Khushi",
];

export const SURNAMES = [
  "Sharma", "Verma", "Iyer", "Mehta", "Patel", "Reddy", "Nair", "Singh",
  "Kapoor", "Bose", "Gupta", "Chopra", "Joshi", "Malhotra", "Rao", "Menon",
  "Banerjee", "Chatterjee", "Mukherjee", "Pillai", "Khanna", "Saxena",
  "Bhatia", "Aggarwal", "Sinha", "Desai", "Shah", "Trivedi", "Goel", "Pandey",
];

export const CITIES_WEIGHTED: Array<{ city: string; weight: number; tongue: string }> = [
  { city: "Bangalore", weight: 18, tongue: "Kannada" },
  { city: "Mumbai", weight: 16, tongue: "Marathi" },
  { city: "Delhi", weight: 14, tongue: "Hindi" },
  { city: "Pune", weight: 10, tongue: "Marathi" },
  { city: "Hyderabad", weight: 9, tongue: "Telugu" },
  { city: "Chennai", weight: 9, tongue: "Tamil" },
  { city: "Kolkata", weight: 6, tongue: "Bengali" },
  { city: "Ahmedabad", weight: 5, tongue: "Gujarati" },
  { city: "Jaipur", weight: 4, tongue: "Hindi" },
  { city: "Kochi", weight: 4, tongue: "Malayalam" },
  { city: "Lucknow", weight: 3, tongue: "Hindi" },
  { city: "Chandigarh", weight: 2, tongue: "Punjabi" },
];

export const MOTHER_TONGUES = [
  "Hindi", "Tamil", "Telugu", "Kannada", "Marathi", "Bengali", "Gujarati",
  "Malayalam", "Punjabi", "Urdu", "Odia",
];

export const RELIGIONS_WEIGHTED: Array<{ name: string; weight: number; castes: string[] }> = [
  {
    name: "Hindu",
    weight: 70,
    castes: ["Brahmin", "Iyer", "Iyengar", "Reddy", "Maratha", "Kayastha", "Agarwal", "Rajput", "Nair", "Khatri"],
  },
  { name: "Muslim", weight: 12, castes: ["Sunni", "Shia"] },
  { name: "Christian", weight: 6, castes: ["Catholic", "Protestant", "Syrian"] },
  { name: "Sikh", weight: 5, castes: ["Jat", "Khatri", "Arora"] },
  { name: "Jain", weight: 4, castes: ["Digambar", "Shvetambar"] },
  { name: "Parsi", weight: 2, castes: ["Parsi"] },
  { name: "Buddhist", weight: 1, castes: ["Buddhist"] },
];

export const COLLEGES = [
  "IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
  "BITS Pilani", "NIT Trichy", "NIT Surathkal", "Delhi University",
  "St. Stephen's College", "Christ University", "Symbiosis Pune",
  "Manipal Institute of Technology", "VIT Vellore", "SRCC Delhi",
  "Lady Shri Ram College", "St. Xavier's Mumbai", "Loyola Chennai",
  "Anna University", "Jadavpur University", "VJTI Mumbai",
];

export const DEGREES_BY_LEVEL: Record<string, string[]> = {
  "Bachelor's": ["B.Tech Computer Science", "B.Tech Mechanical", "B.Tech Electronics", "B.A. Economics", "B.Com", "B.Sc Physics", "B.Arch", "BBA"],
  "Master's": ["M.Tech CSE", "MBA", "M.S. Computer Science", "M.A. Economics", "M.Sc Data Science", "M.Des"],
  "PhD": ["PhD Computer Science", "PhD Economics", "PhD Biotechnology"],
  "Professional": ["MBBS", "CA", "LL.B.", "MD Internal Medicine", "B.Arch + M.Arch"],
};

export const COMPANIES = [
  "Stripe", "Google", "Microsoft", "Razorpay", "Flipkart", "Zerodha", "Atlassian",
  "Swiggy", "Zomato", "PhonePe", "Cred", "Tata Consultancy Services", "Infosys",
  "Wipro", "Mu Sigma", "McKinsey & Company", "Bain & Company", "Goldman Sachs",
  "JP Morgan", "HUL", "ITC", "Deloitte", "Self-employed", "Mahindra", "Ola",
];

export const DESIGNATIONS = [
  "Software Engineer", "Senior Software Engineer", "Product Manager",
  "Data Scientist", "Marketing Manager", "Investment Analyst", "Consultant",
  "Doctor", "Architect", "Chartered Accountant", "Designer", "Founder",
  "VP Engineering", "Operations Lead", "Lawyer",
];

export const OCCUPATIONS_PARENT = [
  "Retired Government Officer", "Doctor", "Schoolteacher", "Businessman",
  "Homemaker", "Banker", "Engineer", "Professor", "Lawyer", "Farmer",
  "Retired Army Officer",
];
