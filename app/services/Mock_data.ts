import { VerificationRequest, ActiveEstate } from "./types";

export const MOCK_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    estate_id: "est_771",
    estate_name: "Sherwood Forest Estate",
    cac_number: "RC-1029384",
    tin_number: "TIN-88221100",
    cac_cert_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=CAC+Certificate+Copy",
    tin_cert_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=TIN+Document",
    authorization_letter_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Letter+of+Authorization",
    authorizing_body_name: "Lagos State Land Bureau",
    estate_utility_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Estate+Electricity+Bill",
    cac_verification_status: "pending",
    bank_account_name: "Sherwood Estate Management",
    bank_account_number: "0011223344",
    bank_name: "Access Bank",
    city: "Lagos",
    town: "Ajah",
    business_type: "Limited Liability Company",
    registered_address: "12 Forest Way, Ajah, Lagos",
    registration_date: "2024-05-12",
    admin_id: "adm_001",
    admin_name: "Simon Peter",
    admin_email: "simon.p@gate-man.com",
    admin_status: "pending",
    verification_step: 4,
    nin_number: "12345678901",
    bvn_number: "22233344455",
    admin_selfie_url: "https://i.pravatar.cc/400?u=simon",
    liveness_snaps: [
      "https://i.pravatar.cc/200?u=s1",
      "https://i.pravatar.cc/200?u=s2",
      "https://i.pravatar.cc/200?u=s3",
    ],
    signature_url:
      "https://placehold.co/400x200/ffffff/000000.png?text=Simon+Peter+Signature",
    identity_type: "NIN",
    identiy_type: "NIN",
    avatar: "https://i.pravatar.cc/150?u=simon",
    admin_utility_url:
      "https://placehold.co/600x800/f1f5f9/64748b.png?text=Admin+Personal+Utility",
    kyc_submitted_at: "2026-04-10T14:30:00Z",
  },
  {
    estate_id: "est_772",
    estate_name: "Eko Atlantic Towers",
    cac_number: "RC-9922331",
    tin_number: "TIN-11002233",
    cac_cert_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=CAC+Towers+Ltd",
    tin_cert_url: null,
    authorization_letter_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Eko+Dev+Auth",
    authorizing_body_name: "Eko Development Co.",
    estate_utility_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Water+Bill+April",
    cac_verification_status: "pending",
    bank_account_name: "Eko Atlantic Dues",
    bank_account_number: "1029384756",
    bank_name: "GTBank",
    city: "Lagos",
    town: "Victoria Island",
    business_type: "Corporate Entity",
    registered_address: "Plot 1, Ocean View Drive, VI",
    registration_date: "2022-11-20",
    admin_id: "adm_002",
    admin_name: "Aisha Yusuf",
    admin_email: "a.yusuf@ekoatlantic.com",
    admin_status: "pending",
    verification_step: 3,
    nin_number: "98765432109",
    bvn_number: "55566677788",
    admin_selfie_url: "https://i.pravatar.cc/400?u=aisha",
    liveness_snaps: [
      "https://i.pravatar.cc/200?u=a1",
      "https://i.pravatar.cc/200?u=a2",
    ],
    signature_url:
      "https://placehold.co/400x200/ffffff/000000.png?text=Aisha+Yusuf+Sign",
    identity_type: "International Passport",
    identiy_type: "International Passport",
    avatar: "https://i.pravatar.cc/150?u=aisha",
    admin_utility_url: null,
    kyc_submitted_at: "2026-04-11T09:15:00Z",
  },
  {
    estate_id: "est_773",
    estate_name: "Maryland Crescent",
    cac_number: "BN-002931",
    tin_number: "TIN-44556677",
    cac_cert_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Business+Name+Cert",
    tin_cert_url: null,
    authorization_letter_url: null,
    authorizing_body_name: "Ikeja LG Council",
    estate_utility_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Waste+Mgt+Bill",
    cac_verification_status: "pending",
    bank_account_name: "Maryland Residents Assoc",
    bank_account_number: "5544332211",
    bank_name: "Zenith Bank",
    city: "Lagos",
    town: "Ikeja",
    business_type: "Registered NGO",
    registered_address: "4 Maryland Crescent, Ikeja",
    registration_date: "2025-01-05",
    admin_id: "adm_003",
    admin_name: "Chidi Okafor",
    admin_email: "chidi.o@maryland.org",
    admin_status: "pending",
    verification_step: 4,
    nin_number: "44553322110",
    bvn_number: "11100022233",
    admin_selfie_url: "https://i.pravatar.cc/400?u=chidi",
    liveness_snaps: [
      "https://i.pravatar.cc/200?u=c1",
      "https://i.pravatar.cc/200?u=c2",
      "https://i.pravatar.cc/200?u=c3",
    ],
    signature_url:
      "https://placehold.co/400x200/ffffff/000000.png?text=Chidi+Signature",
    identity_type: "Driver's License",
    identiy_type: "Driver's License",
    avatar: "https://i.pravatar.cc/150?u=chidi",
    admin_utility_url:
      "https://placehold.co/600x800/f1f5f9/64748b.png?text=Home+Bill+Chidi",
    kyc_submitted_at: "2026-04-12T11:00:00Z",
  },
  {
    estate_id: "est_774",
    estate_name: "Diamond Valley Estate",
    cac_number: "RC-4488229",
    tin_number: "TIN-33221144",
    cac_cert_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Diamond+Valley+Ltd",
    tin_cert_url: "https://placehold.co/600x800/e2e8f0/475569.png?text=TIN+Doc",
    authorization_letter_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Resident+Assoc+Auth",
    authorizing_body_name: "Magodo GRA Phase 2",
    estate_utility_url:
      "https://placehold.co/600x800/e2e8f0/475569.png?text=Security+Levy+Receipt",
    cac_verification_status: "pending",
    bank_account_name: "Diamond Valley Operations",
    bank_account_number: "9988776655",
    bank_name: "First Bank",
    city: "Lagos",
    town: "Magodo",
    business_type: "Limited Liability Company",
    registered_address: "Plot 404, Diamond Dr, Magodo",
    registration_date: "2023-08-14",
    admin_id: "adm_004",
    admin_name: "Olumide Bakare",
    admin_email: "o.bakare@magodo.com",
    admin_status: "pending",
    verification_step: 4,
    nin_number: "88997766554",
    bvn_number: "44433322211",
    admin_selfie_url: "https://i.pravatar.cc/400?u=olumide",
    liveness_snaps: [
      "https://i.pravatar.cc/200?u=o1",
      "https://i.pravatar.cc/200?u=o2",
      "https://i.pravatar.cc/200?u=o3",
    ],
    signature_url:
      "https://placehold.co/400x200/ffffff/000000.png?text=Bakare+Signature",
    identity_type: "NIN",
    identiy_type: "NIN",
    avatar: "https://i.pravatar.cc/150?u=olumide",
    admin_utility_url:
      "https://placehold.co/600x800/f1f5f9/64748b.png?text=Utility+Olu",
    kyc_submitted_at: "2026-04-12T16:20:00Z",
  },
];


export const MOCK_ACTIVE_ESTATES: ActiveEstate[] = [
  {
    // --- Core Identity ---
    estate_id: "e1e2e3-u4u5-5678",
    estate_name: "Lekki Gardens Horizon 2",
    estate_code: "LGH2",
    city: "Lagos",
    town: "Lekki Phase 1",
    created_at: "2023-10-15T08:30:00Z",

    // --- Business Details ---
    cac_number: "RC 1234567",
    tin_number: "TIN-87654321",
    business_type: "Private Limited Company",
    registered_address: "Plot 12, Admiralty Way, Lekki, Lagos State",
    registration_date: "2018-05-15",
    cac_verification_status: "verified",

    // --- Document URLs (Real-world architectural examples) ---
    // Note: In real app, these are secured storage URLs (S3/Cloudinary)
    cac_cert_url:
      "https://images.unsplash.com/photo-1577416416181-f2843232eab3?q=80&w=1000", // Certificate placeholder
    tin_cert_url:
      "https://images.unsplash.com/photo-1586282023358-9418a0028a3f?q=80&w=1000", // Document placeholder
    estate_utility_url:
      "https://images.unsplash.com/photo-1544985338-ee42c4b8b809?q=80&w=1000", // Utility placeholder
    authorization_letter_url:
      "https://images.unsplash.com/photo-1596526122619-a1b7829707ea?q=80&w=1000", // Letter placeholder
    authorizing_body_name:
      "Lagos State Development and Property Corporation (LSDPC)",

    // --- Financial Info ---
    bank_account_number: "0011223344",
    bank_account_name: "GateMan Services - Lekki Gardens",
    bank_name: "Access Bank Plc",
    bank_code: "044",
    paystack_subaccount_code: "ACCT_1234abcd",
    wallet_balance: "2450000.75", // SQL numeric to string

    // --- Stats ---
    tenant_count: "1250", // SQL count to string

    // --- Admin Context ---
    admin_id: "a1a2-u3u4-5678",
    admin_name: "Adewale Adenuga",
    admin_email: "a.adenuga@lekkigardens.com",
    admin_status: "verified",
  },
  {
    estate_id: "f1f2-v3v4-9012",
    estate_name: "Banana Island Residency",
    estate_code: "BISR",
    city: "Lagos",
    town: "Ikoyi",
    created_at: "2024-01-20T10:00:00Z",

    cac_number: "RC 7654321",
    tin_number: "TIN-12345678",
    business_type: "Limited Partnership",
    registered_address: "15 Banana Island Road, Ikoyi, Lagos State",
    registration_date: "2020-02-12",
    cac_verification_status: "verified",

    cac_cert_url:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000",
    tin_cert_url:
      "https://images.unsplash.com/photo-1560185008-a83624e5d59c?q=80&w=1000",
    estate_utility_url:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1000",
    authorization_letter_url:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000",
    authorizing_body_name: "Federal Housing Authority (FHA)",

    bank_account_number: "0022334455",
    bank_account_name: "GateMan Services - Banana Island",
    bank_name: "Zenith Bank Plc",
    bank_code: "057",
    paystack_subaccount_code: "ACCT_5678efgh",
    wallet_balance: "15750000.50",

    tenant_count: "450",

    admin_id: "b1b2-v3v4-9012",
    admin_name: "Ngozi Okafor",
    admin_email: "n.okafor@bananaresidency.com",
    admin_status: "verified",
  },
  {
    estate_id: "g1g2-w3w4-3456",
    estate_name: "Gwarinpa Estate Phase 3",
    estate_code: "GWA3",
    city: "Abuja",
    town: "Gwarinpa",
    created_at: "2023-08-05T14:15:00Z",

    cac_number: "RC 9876543",
    tin_number: "TIN-43210987",
    business_type: "Sole Proprietorship (Business Name)",
    registered_address: "Plot 105, 3rd Avenue, Gwarinpa, FCT, Abuja",
    registration_date: "2015-11-20",
    cac_verification_status: "verified",

    cac_cert_url:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1000",
    tin_cert_url:
      "https://images.unsplash.com/photo-1613498372142-d2d0ac85d32e?q=80&w=1000",
    estate_utility_url:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1000",
    authorization_letter_url:
      "https://images.unsplash.com/photo-1523217582562-09d0def513e2?q=80&w=1000",
    authorizing_body_name: "Abuja Metropolitan Management Council (AMMC)",

    bank_account_number: "0033445566",
    bank_account_name: "GateMan Services - Gwarinpa Estate",
    bank_name: "United Bank for Africa (UBA) Plc",
    bank_code: "033",
    paystack_subaccount_code: "ACCT_9012ijkl",
    wallet_balance: "780000.20",

    tenant_count: "3200",

    admin_id: "c1c2-w3w4-3456",
    admin_name: "Ibrahim Musa",
    admin_email: "i.musa@gwarinpaestate.com",
    admin_status: "verified",
  },
];