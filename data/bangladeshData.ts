// Bangladesh Districts and Thanas Data

export const bangladeshDistricts = [
  { id: '1', name: 'Dhaka', division: 'Dhaka' },
  { id: '2', name: 'Gazipur', division: 'Dhaka' },
  { id: '3', name: 'Narayanganj', division: 'Dhaka' },
  { id: '4', name: 'Tangail', division: 'Dhaka' },
  { id: '5', name: 'Kishoreganj', division: 'Dhaka' },
  { id: '6', name: 'Manikganj', division: 'Dhaka' },
  { id: '7', name: 'Munshiganj', division: 'Dhaka' },
  { id: '8', name: 'Narsingdi', division: 'Dhaka' },
  { id: '9', name: 'Rajbari', division: 'Dhaka' },
  { id: '10', name: 'Chittagong', division: 'Chittagong' },
  { id: '11', name: 'Cox\'s Bazar', division: 'Chittagong' },
  { id: '12', name: 'Rangamati', division: 'Chittagong' },
  { id: '13', name: 'Bandarban', division: 'Chittagong' },
  { id: '14', name: 'Khagrachari', division: 'Chittagong' },
  { id: '15', name: 'Feni', division: 'Chittagong' },
  { id: '16', name: 'Comilla', division: 'Chittagong' },
  { id: '17', name: 'Sylhet', division: 'Sylhet' },
  { id: '18', name: 'Moulvibazar', division: 'Sylhet' },
  { id: '19', name: 'Habiganj', division: 'Sylhet' },
  { id: '20', name: 'Sunamganj', division: 'Sylhet' },
  { id: '21', name: 'Rajshahi', division: 'Rajshahi' },
  { id: '22', name: 'Bogra', division: 'Rajshahi' },
  { id: '23', name: 'Natore', division: 'Rajshahi' },
  { id: '24', name: 'Pabna', division: 'Rajshahi' },
  { id: '25', name: 'Sirajganj', division: 'Rajshahi' },
  { id: '26', name: 'Khulna', division: 'Khulna' },
  { id: '27', name: 'Jessore', division: 'Khulna' },
  { id: '28', name: 'Satkhira', division: 'Khulna' },
  { id: '29', name: 'Bagerhat', division: 'Khulna' },
  { id: '30', name: 'Barisal', division: 'Barisal' },
  { id: '31', name: 'Patuakhali', division: 'Barisal' },
  { id: '32', name: 'Bhola', division: 'Barisal' },
  { id: '33', name: 'Rangpur', division: 'Rangpur' },
  { id: '34', name: 'Dinajpur', division: 'Rangpur' },
  { id: '35', name: 'Mymensingh', division: 'Mymensingh' },
];

export const thanasByDistrict: { [key: string]: string[] } = {
  'Dhaka': [
    'Dhanmondi', 'Gulshan', 'Banani', 'Mirpur', 'Mohammadpur', 'Uttara',
    'Badda', 'Rampura', 'Tejgaon', 'Motijheel', 'Paltan', 'Ramna',
    'Shahbagh', 'Mohakhali', 'Kafrul', 'Cantonment', 'Lalbagh', 'Kotwali',
    'Sutrapur', 'Demra', 'Jatrabari', 'Khilgaon', 'Sabujbagh'
  ],
  'Gazipur': [
    'Gazipur Sadar', 'Tongi', 'Kaliakair', 'Kapasia', 'Sreepur'
  ],
  'Narayanganj': [
    'Narayanganj Sadar', 'Bandar', 'Rupganj', 'Sonargaon', 'Araihazar'
  ],
  'Tangail': [
    'Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Ghatail',
    'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur'
  ],
  'Chittagong': [
    'Agrabad', 'Panchlaish', 'Kotwali', 'Chandgaon', 'Halishahar',
    'Khulshi', 'Pahartali', 'Bayazid Bostami', 'Bakalia', 'Bandar',
    'Double Mooring', 'EPZ', 'Karnaphuli', 'Patenga', 'Sadarghat'
  ],
  'Cox\'s Bazar': [
    'Cox\'s Bazar Sadar', 'Chakaria', 'Ramu', 'Teknaf', 'Ukhia',
    'Pekua', 'Kutubdia', 'Maheshkhali'
  ],
  'Sylhet': [
    'Sylhet Sadar', 'Beanibazar', 'Bishwanath', 'Companiganj',
    'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur',
    'Kanaighat', 'Zakiganj', 'Balaganj', 'Osmaninagar'
  ],
  'Rajshahi': [
    'Rajshahi Sadar', 'Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum',
    'Paba', 'Durgapur', 'Mohonpur', 'Charghat', 'Puthia', 'Bagha'
  ],
  'Khulna': [
    'Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali',
    'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha',
    'Phultala', 'Rupsa', 'Terokhada'
  ],
  'Barisal': [
    'Barisal Sadar', 'Bakerganj', 'Babuganj', 'Banaripara', 'Gaurnadi',
    'Agailjhara', 'Mehendiganj', 'Muladi', 'Hizla', 'Wazirpur'
  ],
  'Rangpur': [
    'Rangpur Sadar', 'Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur',
    'Pirgachha', 'Pirganj', 'Taraganj'
  ],
  'Mymensingh': [
    'Mymensingh Sadar', 'Bhaluka', 'Trishal', 'Muktagachha', 'Gaffargaon',
    'Gauripur', 'Haluaghat', 'Ishwarganj', 'Nandail', 'Phulbaria', 'Fulpur'
  ],
  'Comilla': [
    'Comilla Sadar', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina',
    'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam',
    'Muradnagar', 'Nangalkot', 'Meghna', 'Titas'
  ],
  'Bogra': [
    'Bogra Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali',
    'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur',
    'Shibganj', 'Sonatala'
  ],
  'Jessore': [
    'Jessore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha',
    'Keshabpur', 'Manirampur', 'Sharsha'
  ],
};

export const phoneOperators = [
  { code: '013', operator: 'Grameenphone' },
  { code: '014', operator: 'Banglalink' },
  { code: '015', operator: 'Teletalk' },
  { code: '016', operator: 'Airtel' },
  { code: '017', operator: 'Grameenphone' },
  { code: '018', operator: 'Robi' },
  { code: '019', operator: 'Banglalink' },
];

export const validateBangladeshPhone = (phone: string): boolean => {
  // Remove spaces, dashes, and + sign
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  
  // Check if it starts with 880 (international format)
  if (cleaned.startsWith('880')) {
    const number = cleaned.slice(3); // Remove 880
    return /^1[3-9]\d{8}$/.test(number); // Must be 11 digits starting with 01
  }
  
  // Check if it starts with 01 (local format)
  if (cleaned.startsWith('01')) {
    return /^01[3-9]\d{8}$/.test(cleaned); // Must be 11 digits
  }
  
  return false;
};

export const formatBangladeshPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  
  if (cleaned.startsWith('880')) {
    const number = cleaned.slice(3);
    return `+880 ${number.slice(0, 4)}-${number.slice(4)}`;
  }
  
  if (cleaned.startsWith('01')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return phone;
};
