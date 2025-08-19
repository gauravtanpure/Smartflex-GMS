import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { UserCircle, Upload, CheckCircle, ArrowRight, ArrowLeft, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";

interface UserProfile {
  name_full: string;
  profile_picture_url?: string;
  surname: string;
  first_name: string;
  fathers_name: string;
  residential_address: {
    flat_no: string;
    wing: string;
    floor: string;
    bldg_name: string;
    street: string;
    landmark: string;
    area: string;
    pin_code: string;
  };
  office_address: {
    office_no: string;
    wing: string;
    floor: string;
    bldg_name: string;
    street: string;
    landmark: string;
    area: string;
    pin_code: string;
  };
  telephone_res: string;
  telephone_office: string;
  mobile: string;
  email: string;
  date_of_birth: string;
  blood_group: string;
  marital_status: "married" | "single" | "";
  wedding_anniversary_date: string;
  references: string[];
  physician_name: string;
  physician_contact: string;
  physician_mobile: string;
  physician_tel: string;
  medications: string;
  participating_in_exercise_program_reason: string;
  describe_physical_activity: string;
  do_you_have_condition: {
    difficulty_with_physical_exercise: boolean;
    heart_or_circulatory_lung_problem: boolean;
    cigarette_smoking_habit: boolean;
    obesity_more_than_20_percent_cover_ideal_body_weight: boolean;
    high_blood_cholesterol: boolean;
    history_or_heart_problem_in_immediate_family: boolean;
    high_blood_pressure: boolean;
    history_of_heart_problem_chest_pain_or_smoke: boolean;
    increased_blood_pressure: boolean;
    any_chronic_illness_of_condition: boolean;
    advice_from_physician_not_to_exercise: boolean;
    recent_surgery: boolean;
    pregnant_or_new_born_within_last_3_months: boolean;
    muscle_joint_or_back_disorder: boolean;
    diabetes_or_thyroid_condition: boolean;
    any_other_condition_or_medication_that_may_be_aggravated_by_lifting_weights: boolean;
    any_other_specific_peculiar_detail: string;
  };
  comments: string;
  informed_consent_agreed: boolean;
  rules_regulations_agreed: boolean;
}

const ConsentContent = () => (
  <div className="prose dark:prose-invert">
    <h3 className="text-xl font-bold mb-4">SECTION C: INFORMED CONSENT</h3>
    <p>
      I <strong>_________________________</strong> will be participating in a program of strenuous physical activity including, strength training equipment, Cardio Machines and Crossfit / Functional training offered by Smartflex Fitness.
      I hereby affirm that I am in good physical condition and do not suffer from any disability that would prevent or limit my participation in this exercise program. I will consult/have consulted my physician & sought approval for the above.
    </p>
    <p>
      In consideration that, I may initiate / myself as a result of my participation in Smartflex Fitness exercise program of self exercise program and, I hereby release Smartflex Fitness from all liability arising in the future including, but not limited to, death after an exercise and for pulls or bears, broken bones, shin splints, heat prostration, knee / lower back / foot injuries, and any other illness, soreness, or injury however cause, occurring during or after my participation in the exercise program." Smartflex Fitness will not be responsible.
    </p>
    <p>
      I have read and understood the membership rules & regulation of the Smartflex Fitness and undertake to abide by them as amended from time to time. I further declare that all the information with regards to my self and my health, provided to the Management is true & best of belief, true & correct. I also give the management information of any change with respect to my health condition. I shall be using the fitness centre facility under supervision & guidance of the management & fully understand that I shall be solely responsible for any mishap / accident / injury sustained on account of usage of the facilities at the fitness centre. I also permit Smartflex Fitness to send me the regular update message related to Fitness functions and offers on my mobile number.
    </p>
    <p className="mt-6 font-semibold">I hereby affirm I have read fully understand the above.</p>
  </div>
);

const RulesContent = () => (
  <div className="prose dark:prose-invert">
    <h3 className="text-xl font-bold mb-4">RULES & REGULATIONS / BY-LAWS</h3>
    <p>
      The "SMARTFLEX FITNESS" Brand name is the exclusive property of the company and any unauthorised use of the same would amount to infringement of property rights under the Trade Marks Act, 1999.
    </p>
    
    <h4 className="mt-4 font-bold">DEFINITIONS</h4>
    <ul>
      <li>"SMARTFLEX FITNESS" is an exclusive brand name of the company.</li>
      <li>"Fitness Centre" means the health club operated by the Company.</li>
      <li>"Facilities of the Fitness Centre" means the various functional programmes announced by the management of the company (from time to time) which may include cardio vascular exercises, weight management programme, weight loss programme, weight gain programme, steam etc.</li>
      <li>"Person" means any individual company (whether limited or unlimited, whether private or public or non-profit making) trust, body of incorporated persons, having a legal status.</li>
      <li>"Member" means any person who has been admitted to the membership of the various facilities of the fitness centre or fitness centre as a whole by the management of the company for a consideration payable in monetary terms or otherwise.</li>
      <li>"Membership" means the right to enjoy the various facilities of the fitness centre by virtue of being a member of the fitness centre.</li>
      <li>"Refundable Deposits" means money paid by the member to the Company on being admitted to the membership of the specified branch of the Company's fitness centre for a limited tenure under the Refundable membership scheme of the fitness centre.</li>
      <li>"Non-Refundable Membership" means money paid by the member to the Company on being admitted to the membership of the specified branch of the Company's fitness centre for a limited tenure not being the Refundable deposit scheme of the fitness centre.</li>
    </ul>

    <h4 className="mt-4 font-bold">Refundable Deposits Incase</h4>
    <p>
      The deposits would be accepted against a deposit receipt issued by the management of the Company that has to be returned by the member in his safe custody. The deposit would be refunded by the Company to the member concerned at the end of the tenure of membership in surrendering of the deposit receipt in original only. The claim for the deposit has to made within three months of the refundable deposit being due, failing which the Company reserves the right to forfeit the same. Non refundable deposit would be refunded subject to any statutory dues, rates, levies, taxes, charges etc. and/or any charges, damages, penalties etc. being due to the company form the member concerned. The decision of the management of the company would not be final and binding with respect to the charges, damages, penalties etc. leviable on the member concerned.
    </p>

    <h4 className="mt-4 font-bold">Note</h4>
    <p>
      These deposits are not covered by what is contemplated under section 58A of the Companies Act, 1956. Further, these deposits are interest free deposits. The Management would be liable for any claims of interest or charges of these deposits.
    </p>
    
    <h4 className="mt-4 font-bold">Notice Board</h4>
    <p>
      All communications to the members including any amendments in rules, regulation, timing, programme etc. would be displayed on the notice board & Mobile Massages. Members are requested to keep themselves updated.
    </p>

    <h4 className="mt-4 font-bold">Prior Claims</h4>
    <p>
      Management will not entertain any premature claims of the refundable deposits.
    </p>

    <h4 className="mt-4 font-bold">Subscription</h4>
    <p>
      The management reserves the right to levy any periodic subscription charges along with any statutory, dues, rates, levies, taxes, charges etc. on refundable membership as & when deemed necessary ?
    </p>
  </div>
);


export default function ProfileCompletion() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [step, setStep] = useState(1);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const totalSteps = 4;

  const [profile, setProfile] = useState<UserProfile>({
    name_full: "",
    surname: "",
    first_name: "",
    fathers_name: "",
    residential_address: {
      flat_no: "", wing: "", floor: "", bldg_name: "", street: "",
      landmark: "", area: "", pin_code: "",
    },
    office_address: {
      office_no: "", wing: "", floor: "", bldg_name: "", street: "",
      landmark: "", area: "", pin_code: "",
    },
    telephone_res: "",
    telephone_office: "",
    mobile: "",
    email: localStorage.getItem("email") || "",
    date_of_birth: "",
    blood_group: "",
    marital_status: "",
    wedding_anniversary_date: "",
    references: ["", ""],
    physician_name: "",
    physician_contact: "",
    physician_mobile: "",
    physician_tel: "",
    medications: "",
    participating_in_exercise_program_reason: "",
    describe_physical_activity: "",
    do_you_have_condition: {
      difficulty_with_physical_exercise: false,
      heart_or_circulatory_lung_problem: false,
      cigarette_smoking_habit: false,
      obesity_more_than_20_percent_cover_ideal_body_weight: false,
      high_blood_cholesterol: false,
      history_or_heart_problem_in_immediate_family: false,
      high_blood_pressure: false,
      history_of_heart_problem_chest_pain_or_smoke: false,
      increased_blood_pressure: false,
      any_chronic_illness_of_condition: false,
      advice_from_physician_not_to_exercise: false,
      recent_surgery: false,
      pregnant_or_new_born_within_last_3_months: false,
      muscle_joint_or_back_disorder: false,
      diabetes_or_thyroid_condition: false,
      any_other_condition_or_medication_that_may_be_aggravated_by_lifting_weights: false,
      any_other_specific_peculiar_detail: "",
    },
    comments: "",
    informed_consent_agreed: false,
    rules_regulations_agreed: false,
  });

  const calculateCompletionPercentage = (currentProfile: UserProfile): number => {
    let completedFields = 0;
    let totalFields = 0;

    if (currentProfile.name_full.trim() !== "") completedFields++;
    totalFields++;
    if (currentProfile.surname.trim() !== "") completedFields++;
    totalFields++;
    if (currentProfile.first_name.trim() !== "") completedFields++;
    totalFields++;
    if (currentProfile.mobile.trim() !== "") completedFields++;
    totalFields++;
    if (currentProfile.date_of_birth.trim() !== "") completedFields++;
    totalFields++;
    if (currentProfile.email.trim() !== "") completedFields++;
    totalFields++;

    if (currentProfile.residential_address.street.trim() !== "") completedFields++;
    totalFields++;
    if (currentProfile.residential_address.pin_code.trim() !== "") completedFields++;
    totalFields++;

    if (currentProfile.physician_name.trim() !== "") completedFields++;
    totalFields++;
    if (currentProfile.medications.trim() !== "") completedFields++;
    totalFields++;
    if (currentProfile.describe_physical_activity.trim() !== "") completedFields++;
    totalFields++;

    if (currentProfile.informed_consent_agreed) completedFields++;
    totalFields++;
    if (currentProfile.rules_regulations_agreed) completedFields++;
    totalFields++;

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("user_id");

      if (!token || !userId) {
        toast({
          title: "Error",
          description: "Authentication token or User ID missing. Please log in.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      try {
        const resUser = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!resUser.ok) throw new Error("User fetch failed");
        const userData = await resUser.json();

        const resMember = await fetch(`${import.meta.env.VITE_API_URL}/users/member/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        let memberData = {};
        if (resMember.status === 200) {
          memberData = await resMember.json();
          setProfileExists(true);
          setSelectedImage(memberData.profile_picture_url || null);
        } else if (resMember.status === 404) {
          setProfileExists(false);
        } else {
          throw new Error("Unexpected error while fetching member profile.");
        }

        setProfile(prev => {
          const newProfile = {
            ...prev,
            name_full: memberData.name_full || "",
            surname: memberData.surname || "",
            profile_picture_url: memberData.profile_picture_url || prev.profile_picture_url || "",
            first_name: memberData.first_name || "",
            fathers_name: memberData.fathers_name || "",
            residential_address: {
              flat_no: memberData.res_flat_no || "",
              wing: memberData.res_wing || "",
              floor: memberData.res_floor || "",
              bldg_name: memberData.res_bldg_name || "",
              street: memberData.res_street || "",
              landmark: memberData.res_landmark || "",
              area: memberData.res_area || "",
              pin_code: memberData.res_pin_code || "",
            },
            office_address: {
              office_no: memberData.off_office_no || "",
              wing: memberData.off_wing || "",
              floor: memberData.off_floor || "",
              bldg_name: memberData.off_bldg_name || "",
              street: memberData.off_street || "",
              landmark: memberData.off_landmark || "",
              area: memberData.off_area || "",
              pin_code: memberData.off_pin_code || "",
            },
            telephone_res: memberData.telephone_res || "",
            telephone_office: memberData.telephone_office || "",
            mobile: memberData.mobile || userData.phone || "",
            email: memberData.email || userData.email || "",
            date_of_birth: memberData.date_of_birth || "",
            blood_group: memberData.blood_group || "",
            marital_status: memberData.marital_status || "",
            wedding_anniversary_date: memberData.wedding_anniversary_date || "",
            references: [memberData.reference1 || "", memberData.reference2 || ""],
            physician_name: memberData.physician_name || "",
            physician_contact: memberData.physician_contact || "",
            physician_mobile: memberData.physician_mobile || "",
            physician_tel: memberData.physician_tel || "",
            medications: memberData.medications || "",
            participating_in_exercise_program_reason: memberData.participating_in_exercise_program_reason || "",
            describe_physical_activity: memberData.describe_physical_activity || "",
            do_you_have_condition: {
              ...prev.do_you_have_condition,
              any_other_specific_peculiar_detail: memberData.any_other_condition_detail || "",
            },
            comments: memberData.comments || "",
            informed_consent_agreed: memberData.informed_consent_agreed === "true" || false,
            rules_regulations_agreed: memberData.rules_regulations_agreed === "true" || false,
          };
          const percent = calculateCompletionPercentage(newProfile);
          localStorage.setItem("profile_completion_percentage", percent.toString());
          return newProfile;
        });

        toast({
          title: "Profile Loaded",
          description: "Your saved profile has been loaded.",
          variant: "success",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch profile data.",
          variant: "destructive",
        });
        console.error(err);
      }
    };
    fetchProfile();
  }, [navigate, toast]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setProfile(prev => {
      let updatedProfile = { ...prev };

      if (name.startsWith("residential_address.") || name.startsWith("office_address.")) {
        const [addressType, field] = name.split(".");
        updatedProfile = {
          ...updatedProfile,
          [addressType]: {
            ...updatedProfile[addressType as "residential_address" | "office_address"],
            [field]: value,
          },
        };
      } else if (name.startsWith("do_you_have_condition.")) {
        const field = name.split(".")[1];
        updatedProfile = {
          ...updatedProfile,
          do_you_have_condition: {
            ...updatedProfile.do_you_have_condition,
            [field]: type === "checkbox" ? checked : value,
          },
        };
      } else if (name.startsWith("references.")) {
        const index = parseInt(name.split(".")[1]);
        const newRefs = [...updatedProfile.references];
        newRefs[index] = value;
        updatedProfile = { ...updatedProfile, references: newRefs };
      } else if (type === "checkbox") {
        updatedProfile = { ...updatedProfile, [name]: checked };
      } else {
        updatedProfile = { ...updatedProfile, [name]: value };
      }

      const percentage = calculateCompletionPercentage(updatedProfile);
      localStorage.setItem("profile_completion_percentage", percentage.toString());
      window.dispatchEvent(new Event("storage"));
      return updatedProfile;
    });
  };

  const handleRadioChange = (name: keyof UserProfile, value: string) => {
    setProfile(prev => {
      const updatedProfile = { ...prev, [name]: value };
      const percentage = calculateCompletionPercentage(updatedProfile);
      localStorage.setItem("profile_completion_percentage", percentage.toString());
      window.dispatchEvent(new Event("storage"));
      return updatedProfile;
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.informed_consent_agreed || !profile.rules_regulations_agreed) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the Informed Consent and Rules & Regulations.",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      toast({
        title: "Error",
        description: "Authentication token or User ID missing. Please log in.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name_full,
          email: profile.email,
          phone: profile.mobile,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update user's basic info.");
      }

      const memberRes = await fetch(`${import.meta.env.VITE_API_URL}/users/profile-complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          name_full: profile.name_full,
          surname: profile.surname,
          first_name: profile.first_name,
          fathers_name: profile.fathers_name,
          res_flat_no: profile.residential_address.flat_no,
          res_wing: profile.residential_address.wing,
          res_floor: profile.residential_address.floor,
          res_bldg_name: profile.residential_address.bldg_name,
          res_street: profile.residential_address.street,
          res_landmark: profile.residential_address.landmark,
          res_area: profile.residential_address.area,
          res_pin_code: profile.residential_address.pin_code,
          off_office_no: profile.office_address.office_no,
          off_wing: profile.office_address.wing,
          off_floor: profile.office_address.floor,
          off_bldg_name: profile.office_address.bldg_name,
          off_street: profile.office_address.street,
          off_landmark: profile.office_address.landmark,
          off_area: profile.office_address.area,
          off_pin_code: profile.office_address.pin_code,
          telephone_res: profile.telephone_res,
          telephone_office: profile.telephone_office,
          mobile: profile.mobile,
          email: profile.email,
          date_of_birth: profile.date_of_birth,
          blood_group: profile.blood_group,
          marital_status: profile.marital_status,
          wedding_anniversary_date: profile.wedding_anniversary_date,
          reference1: profile.references[0],
          reference2: profile.references[1],
          physician_name: profile.physician_name,
          physician_contact: profile.physician_contact,
          physician_mobile: profile.physician_mobile,
          physician_tel: profile.physician_tel,
          medications: profile.medications,
          participating_in_exercise_program_reason: profile.participating_in_exercise_program_reason,
          describe_physical_activity: profile.describe_physical_activity,
          any_other_condition_detail: profile.do_you_have_condition.any_other_specific_peculiar_detail,
          comments: profile.comments,
          informed_consent_agreed: profile.informed_consent_agreed,
          rules_regulations_agreed: profile.rules_regulations_agreed,
        }),
      });

      if (!memberRes.ok) {
        const memberError = await memberRes.json();
        throw new Error(memberError.detail || "Could not save detailed profile.");
      }

      const percentage = calculateCompletionPercentage(profile);
      localStorage.setItem("profile_completion_percentage", percentage.toString());
      window.dispatchEvent(new Event("storage"));

      toast({
        title: "Profile Saved",
        description: "Your profile has been successfully updated!",
        variant: "success",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while saving your profile.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(URL.createObjectURL(file));

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("user_id");
      if (!token || !userId) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/upload-profile-picture?user_id=${userId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
          variant: "success",
        });

        setProfile(prev => ({ ...prev, profile_picture_url: data.url }));

      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to upload profile picture",
          variant: "destructive",
        });
      }
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    let y = 10;
    const lineHeight = 7;
    const margin = 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SmartFlex Fitness - Profile Summary", margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Date of Export: ${new Date().toLocaleDateString()}`, margin, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Section A: Personal Info", margin, y);
    y += lineHeight;

    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${profile.name_full}`, margin, y);
    y += lineHeight;
    doc.text(`Mobile: ${profile.mobile}`, margin, y);
    doc.text(`Email: ${profile.email}`, 100, y);
    y += lineHeight;
    doc.text(`DOB: ${profile.date_of_birth}`, margin, y);
    doc.text(`Blood Group: ${profile.blood_group}`, 100, y);
    y += lineHeight;
    doc.text(`Marital Status: ${profile.marital_status}`, margin, y);
    y += lineHeight;

    const resAddr = profile.residential_address;
    doc.text(`Address: ${resAddr.flat_no}, ${resAddr.street}, ${resAddr.area}, ${resAddr.pin_code}`, margin, y);
    y += lineHeight;

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Section B: Medical Declaration", margin, y);
    y += lineHeight;

    doc.setFont("helvetica", "normal");
    doc.text(`Physician: ${profile.physician_name} (${profile.physician_contact})`, margin, y);
    y += lineHeight;
    doc.text(`Medications: ${profile.medications || "None"}`, margin, y);
    y += lineHeight;
    doc.text(`Reason: ${profile.participating_in_exercise_program_reason}`, margin, y);
    y += lineHeight;
    doc.text(`Physical Activity: ${profile.describe_physical_activity}`, margin, y);
    y += lineHeight;

    const conditions = profile.do_you_have_condition;
    const positiveConditions = Object.keys(conditions)
      .filter(key => conditions[key as keyof typeof conditions] === true)
      .filter(key => key !== "any_other_specific_peculiar_detail")
      .map(key =>
        key
          .replace(/_/g, " ")
          .replace(/\b\w/g, char => char.toUpperCase())
      );

    const conditionSummary = positiveConditions.length > 0 ? positiveConditions.join(", ") : "None reported";
    y += 2;
    doc.text(`Known Conditions: ${conditionSummary}`, margin, y);
    y += lineHeight;

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Section C: Consent", margin, y);
    y += lineHeight;

    doc.setFont("helvetica", "normal");
    doc.text(`Informed Consent: ${profile.informed_consent_agreed ? "Yes" : "No"}`, margin, y);
    y += lineHeight;
    doc.text(`Rules & Regulations: ${profile.rules_regulations_agreed ? "Yes" : "No"}`, margin, y);
    y += 15;

    doc.setFont("helvetica", "bold");
    doc.text("Signature:", margin, y);
    doc.line(margin + 25, y, margin + 90, y);
    y += lineHeight + 2;
    doc.text("Date:", margin, y);
    doc.line(margin + 25, y, margin + 60, y);

    doc.save("SmartFlex_Profile_Summary.pdf");
  };

  const handleNextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-4xl mx-auto font-poppins">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Complete Your Profile</h1>
        <p className="text-muted-foreground mt-2">Fill out the following sections to get started with SmartFlex Fitness.</p>
      </div>

      <Progress value={(step / totalSteps) * 100} className="w-full h-2 mb-8" />

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {step === 1 && (
          <Card className="shadow-lg animate-fadeIn">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary">Step 1: Personal Information</CardTitle>
              <CardDescription>Start with the basics and your profile photo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-primary transition-all duration-300 hover:border-accent hover:shadow-md cursor-pointer" onClick={handleUploadButtonClick}>
                  {selectedImage || profile.profile_picture_url ? (
                    <img
                      src={selectedImage || profile.profile_picture_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-24 h-24 text-gray-500" />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button variant="outline" type="button" className="w-full max-w-xs" onClick={handleUploadButtonClick}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Photo
                </Button>
                <p className="text-sm text-muted-foreground">Recommended: Square image, max 2MB.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_full">Name in Full</Label>
                  <Input id="name_full" name="name_full" value={profile.name_full} onChange={handleChange} placeholder="Full Name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input id="surname" name="surname" value={profile.surname} onChange={handleChange} placeholder="Surname" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" value={profile.first_name} onChange={handleChange} placeholder="First Name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fathers_name">Father's / Husband's Name</Label>
                  <Input id="fathers_name" name="fathers_name" value={profile.fathers_name} onChange={handleChange} placeholder="Father's / Husband's Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input id="mobile" name="mobile" type="tel" value={profile.mobile} onChange={handleChange} placeholder="Mobile Number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" value={profile.email} onChange={handleChange} placeholder="Email" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input id="date_of_birth" name="date_of_birth" type="date" value={profile.date_of_birth} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood group</Label>
                  <Input id="blood_group" name="blood_group" value={profile.blood_group} onChange={handleChange} placeholder="Blood Group" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone_res">Telephone Res</Label>
                  <Input id="telephone_res" name="telephone_res" value={profile.telephone_res} onChange={handleChange} placeholder="Residential Telephone" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-lg animate-fadeIn">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary">Step 2: Addresses</CardTitle>
              <CardDescription>Enter your residential and office addresses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <h3 className="text-lg font-semibold mt-4">Residential Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input name="residential_address.flat_no" value={profile.residential_address.flat_no} onChange={handleChange} placeholder="Flat No." />
                <Input name="residential_address.wing" value={profile.residential_address.wing} onChange={handleChange} placeholder="Wing" />
                <Input name="residential_address.floor" value={profile.residential_address.floor} onChange={handleChange} placeholder="Floor" />
                <Input name="residential_address.bldg_name" value={profile.residential_address.bldg_name} onChange={handleChange} placeholder="Bldg. Name" />
                <Input name="residential_address.street" value={profile.residential_address.street} onChange={handleChange} placeholder="Street" />
                <Input name="residential_address.landmark" value={profile.residential_address.landmark} onChange={handleChange} placeholder="Landmark" />
                <Input name="residential_address.area" value={profile.residential_address.area} onChange={handleChange} placeholder="Area" />
                <Input name="residential_address.pin_code" value={profile.residential_address.pin_code} onChange={handleChange} placeholder="Pin Code" />
              </div>

              <h3 className="text-lg font-semibold mt-4">Office Address (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input name="office_address.office_no" value={profile.office_address.office_no} onChange={handleChange} placeholder="Office No." />
                <Input name="office_address.wing" value={profile.office_address.wing} onChange={handleChange} placeholder="Wing" />
                <Input name="office_address.floor" value={profile.office_address.floor} onChange={handleChange} placeholder="Floor" />
                <Input name="office_address.bldg_name" value={profile.office_address.bldg_name} onChange={handleChange} placeholder="Bldg. Name" />
                <Input name="office_address.street" value={profile.office_address.street} onChange={handleChange} placeholder="Street" />
                <Input name="office_address.landmark" value={profile.office_address.landmark} onChange={handleChange} placeholder="Landmark" />
                <Input name="office_address.area" value={profile.office_address.area} onChange={handleChange} placeholder="Area" />
                <Input name="office_address.pin_code" value={profile.office_address.pin_code} onChange={handleChange} placeholder="Pin Code" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone_office">Telephone Office</Label>
                  <Input id="telephone_office" name="telephone_office" value={profile.telephone_office} onChange={handleChange} placeholder="Office Telephone" />
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <RadioGroup
                    value={profile.marital_status}
                    onValueChange={(value: "married" | "single") => handleRadioChange("marital_status", value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="married" id="married" />
                      <Label htmlFor="married">Married</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="single" />
                      <Label htmlFor="single">Single</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wedding_anniversary_date">Wedding Anniversary Date</Label>
                  <Input id="wedding_anniversary_date" name="wedding_anniversary_date" type="date" value={profile.wedding_anniversary_date} onChange={handleChange} disabled={profile.marital_status !== 'married'} />
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-4">References</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference1">Reference 1</Label>
                  <Input id="reference1" name="references.0" value={profile.references[0]} onChange={handleChange} placeholder="Reference 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference2">Reference 2</Label>
                  <Input id="reference2" name="references.1" value={profile.references[1]} onChange={handleChange} placeholder="Reference 2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-lg animate-fadeIn">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary">Step 3: Medical Declaration</CardTitle>
              <CardDescription>Please declare any relevant medical conditions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="physician_name">Physician Name</Label>
                  <Input id="physician_name" name="physician_name" value={profile.physician_name} onChange={handleChange} placeholder="Physician Name" />
                </div>
                <div>
                  <Label htmlFor="physician_contact">Physician Contact (Mobile/Tel)</Label>
                  <Input id="physician_contact" name="physician_contact" value={profile.physician_contact} onChange={handleChange} placeholder="Physician Contact" />
                </div>
              </div>
              <div>
                <Label htmlFor="medications">Are you taking any medications?</Label>
                <Textarea id="medications" name="medications" value={profile.medications} onChange={handleChange} placeholder="List any medications" />
              </div>
              <div>
                <Label htmlFor="participating_in_exercise_program_reason">Why are you participating in this exercise programme?</Label>
                <Textarea id="participating_in_exercise_program_reason" name="participating_in_exercise_program_reason" value={profile.participating_in_exercise_program_reason} onChange={handleChange} placeholder="Reason for participation" />
              </div>
              <div>
                <Label htmlFor="describe_physical_activity">Describe any physical activity you do regularly</Label>
                <Textarea id="describe_physical_activity" name="describe_physical_activity" value={profile.describe_physical_activity} onChange={handleChange} placeholder="e.g., walking, running, sports" />
              </div>

              <h3 className="text-lg font-semibold mt-4">Do you now, or have you had in the past:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(profile.do_you_have_condition).map((key) => {
                  if (key === "any_other_specific_peculiar_detail") return null;

                  const labelText = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        name={`do_you_have_condition.${key}`}
                        checked={profile.do_you_have_condition[key as keyof typeof profile.do_you_have_condition] as boolean}
                        onCheckedChange={(checked) => handleChange({ target: { name: `do_you_have_condition.${key}`, type: "checkbox", checked } } as React.ChangeEvent<HTMLInputElement>)}
                      />
                      <Label htmlFor={key}>{labelText}</Label>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <Label htmlFor="any_other_specific_peculiar_detail">Please explain any "Yes" / Any other specific / peculiar detail</Label>
                <Textarea id="any_other_specific_peculiar_detail" name="do_you_have_condition.any_other_specific_peculiar_detail" value={profile.do_you_have_condition.any_other_specific_peculiar_detail} onChange={handleChange} placeholder="Explain details here" />
              </div>
              <div className="mt-4">
                <Label htmlFor="comments">Comments</Label>
                <Textarea id="comments" name="comments" value={profile.comments} onChange={handleChange} placeholder="Any additional comments" />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="shadow-lg animate-fadeIn">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary">Step 4: Informed Consent & Finalization</CardTitle>
              <CardDescription>Please read and agree to the terms below to complete your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="informed_consent_agreed"
                  name="informed_consent_agreed"
                  checked={profile.informed_consent_agreed}
                  onCheckedChange={(checked) => handleChange({ target: { name: "informed_consent_agreed", type: "checkbox", checked } } as React.ChangeEvent<HTMLInputElement>)}
                  required
                />
                <Label htmlFor="informed_consent_agreed" className="flex-1 text-base">
                  I have read and understood the{" "}
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => setIsConsentOpen(true)}
                    className="p-0 h-auto text-primary underline-offset-4 hover:underline"
                  >
                    Informed Consent
                  </Button>
                  {" "}and agree to its terms.
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="rules_regulations_agreed"
                  name="rules_regulations_agreed"
                  checked={profile.rules_regulations_agreed}
                  onCheckedChange={(checked) => handleChange({ target: { name: "rules_regulations_agreed", type: "checkbox", checked } } as React.ChangeEvent<HTMLInputElement>)}
                  required
                />
                <Label htmlFor="rules_regulations_agreed" className="flex-1 text-base">
                  I have read and understood the{" "}
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => setIsRulesOpen(true)}
                    className="p-0 h-auto text-primary underline-offset-4 hover:underline"
                  >
                    Membership Rules & Regulations
                  </Button>
                  {" "}and undertake to abide by them.
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between gap-4 mt-8">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handlePreviousStep} className="flex-1 py-3 text-lg">
              <ArrowLeft className="h-5 w-5 mr-2" /> Previous
            </Button>
          )}
          {step < totalSteps ? (
            <Button type="button" onClick={handleNextStep} className="flex-1 py-3 text-lg">
              Next <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <>
              <Button type="submit" className="flex-1 py-3 text-lg">
                <CheckCircle className="h-5 w-5 mr-2" /> Save Profile
              </Button>
              <Button type="button" onClick={handleExportPdf} className="flex-1 py-3 text-lg" variant="outline">
                Export as PDF
              </Button>
            </>
          )}
        </div>
      </form>

      {/* Informed Consent Dialog */}
      <Dialog open={isConsentOpen} onOpenChange={setIsConsentOpen}>
        <DialogContent className="max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[80vh] overflow-y-auto p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Informed Consent</DialogTitle>
            <DialogDescription>Please read the full consent form below.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ConsentContent />
          </div>
          <Button onClick={() => setIsConsentOpen(false)} className="w-full mt-4">Close</Button>
        </DialogContent>
      </Dialog>

      {/* Rules & Regulations Dialog */}
      <Dialog open={isRulesOpen} onOpenChange={setIsRulesOpen}>
        <DialogContent className="max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[80vh] overflow-y-auto p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Membership Rules & Regulations</DialogTitle>
            <DialogDescription>Please read the rules and regulations below.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <RulesContent />
          </div>
          <Button onClick={() => setIsRulesOpen(false)} className="w-full mt-4">Close</Button>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }

        .prose {
          color: #333;
        }
        .prose h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        .prose p, .prose li {
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 0.5rem;
        }
        .prose li {
          margin-left: 1.5rem;
        }
        .dark .prose {
          color: #ddd;
        }
      `}</style>
    </div>
  );
}