import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  User,
  Zap,
  Shield,
  Database,
  Code,
  CheckCircle2,
  ArrowRight,
  Star,
  ChevronRight,
  Github,
  Loader2,
  Twitter,
  Instagram,
  X,
  Upload,
  Video,
  Square,
  Download,
  Sliders,
  Play,
  Camera,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

// Define the Plan type
interface Plan {
  id: string;
  object: string;
  active: boolean;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  product: string;
  created: number;
  livemode: boolean;
  [key: string]: any;
}

// Testimonial interface
interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
}

// Feature interface
interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
}

// Border Style interface
interface BorderStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export default function BorderPostLanding() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // Use the Supabase client to call the Edge Function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-get-plans",
      );

      if (error) {
        throw error;
      }

      setPlans(data || []);
      setError("");
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setError("Failed to load plans. Please try again later.");
    }
  };

  // Handle checkout process
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan.",
        variant: "default",
      });
      window.location.href = "/login?redirect=pricing";
      return;
    }

    setIsLoading(true);
    setProcessingPlanId(priceId);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            price_id: priceId,
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard`,
          },
          headers: {
            "X-Customer-Email": user.email || "",
          },
        },
      );

      if (error) {
        throw error;
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        toast({
          title: "Redirecting to checkout",
          description:
            "You'll be redirected to Stripe to complete your purchase.",
          variant: "default",
        });
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError("Failed to create checkout session. Please try again.");
      toast({
        title: "Checkout failed",
        description:
          "There was an error creating your checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingPlanId(null);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    });

    return formatter.format(amount / 100);
  };

  // Sample features data
  const features: Feature[] = [
    {
      title: "Easy Video Upload",
      description:
        "Simple drag-and-drop interface for uploading your 1920x1080 videos in seconds.",
      icon: <Upload className="h-10 w-10 text-black" />,
    },
    {
      title: "Real-time Preview",
      description:
        "See your video with applied borders instantly in our real-time preview window.",
      icon: <Video className="h-10 w-10 text-black" />,
    },
    {
      title: "Customizable Borders",
      description:
        "Adjust thickness, color, and style of your video borders with precision controls.",
      icon: <Square className="h-10 w-10 text-black" />,
    },
    {
      title: "Quick Export",
      description:
        "Download your edited video with borders in just a few clicks, ready to share.",
      icon: <Download className="h-10 w-10 text-black" />,
    },
  ];

  // Border styles
  const borderStyles: BorderStyle[] = [
    {
      id: "simple",
      name: "Simple",
      description: "Clean, minimalist border for a professional look",
      preview:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80",
    },
    {
      id: "gradient",
      name: "Gradient",
      description: "Smooth color transitions for a modern aesthetic",
      preview:
        "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=400&q=80",
    },
    {
      id: "animated",
      name: "Animated",
      description: "Subtle motion effects to enhance your content",
      preview:
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
    },
  ];

  // Sample testimonials data
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Content Creator",
      company: "Visual Stories",
      content:
        "The Video Border Editor transformed my content. The clean white borders make my videos stand out on social media and look so much more professional.",
      avatar: "sarah",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Filmmaker",
      company: "Chen Productions",
      content:
        "I've tried many video editing tools, but this border editor is by far the easiest to use. The real-time preview saves me so much time in my workflow.",
      avatar: "michael",
    },
    {
      id: 3,
      name: "Aisha Patel",
      role: "Social Media Manager",
      company: "DigitalWave",
      content:
        "Our marketing team uses this tool daily. The customization options are perfect for maintaining brand consistency across all our video content.",
      avatar: "aisha",
    },
  ];

  // Plan features
  const getPlanFeatures = (planType: string) => {
    const basicFeatures = [
      "Core application features",
      "Basic authentication",
      "1GB storage",
      "Community support",
    ];

    const proFeatures = [
      ...basicFeatures,
      "Advanced analytics",
      "Priority support",
      "10GB storage",
      "Custom branding",
    ];

    const enterpriseFeatures = [
      ...proFeatures,
      "Dedicated account manager",
      "Custom integrations",
      "Unlimited storage",
      "SLA guarantees",
    ];

    if (planType.includes("PRO")) return proFeatures;
    if (planType.includes("ENTERPRISE")) return enterpriseFeatures;
    return basicFeatures;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="font-bold text-xl flex items-center text-black"
            >
              <div className="relative h-6 w-6 mr-2">
                <Camera className="h-6 w-6 text-black fill-black" />
              </div>
              BorderPost
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-black"
                  >
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 text-gray-700 hover:text-black"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                          alt={user.email || ""}
                        />
                        <AvatarFallback>
                          {user.email?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white border-gray-200"
                  >
                    <DropdownMenuLabel className="text-black">
                      My Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem className="text-gray-700 hover:text-black focus:text-black">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-700 hover:text-black focus:text-black">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem
                      onSelect={() => signOut()}
                      className="text-gray-700 hover:text-black focus:text-black"
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-black"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/tempobook/storyboards/558704a3-58e9-4232-a598-621e7697c5e4?storyboard=true&type=COMPONENT&framework=VITE">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2 space-y-8">
                <div>
                  <Badge className="mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300 border-none">
                    New Release v1.0
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                    Enhance Your Videos with Perfect Borders
                  </h1>
                </div>
                <p className="text-lg md:text-xl text-gray-600">
                  A simple, powerful tool to add customizable white borders to
                  your videos. Make your content stand out with
                  professional-looking frames in just a few clicks.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/tempobook/dynamic/src/components/VideoEditorStoryboard?storyboard=true&type=COMPONENT&framework=VITE">
                    <Button
                      size="lg"
                      className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto"
                    >
                      Start Editing Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-gray-300 text-gray-700 hover:border-gray-500 hover:text-black w-full sm:w-auto"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      View Examples
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-black" />
                  <span>No watermarks</span>
                  <Separator
                    orientation="vertical"
                    className="h-4 mx-2 bg-gray-300"
                  />
                  <CheckCircle2 className="h-4 w-4 text-black" />
                  <span>Free tier available</span>
                  <Separator
                    orientation="vertical"
                    className="h-4 mx-2 bg-gray-300"
                  />
                  <CheckCircle2 className="h-4 w-4 text-black" />
                  <span>1080p support</span>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="absolute -z-10 inset-0 bg-gradient-to-tr from-gray-200/60 via-gray-400/40 to-black/10 rounded-3xl blur-2xl transform scale-110" />
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-1 bg-gradient-to-r from-gray-200 via-gray-400 to-black rounded-t-xl">
                    <div className="flex items-center gap-2 px-3 py-1">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <div className="ml-2 text-xs text-black font-medium">
                        BorderPost
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-800">
                    <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden border-8 border-white shadow-md">
                      <img
                        src="https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=800&q=80"
                        alt="Video preview with border"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-black/70 flex items-center justify-center">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-0 -z-10 h-[300px] w-[300px] rounded-full bg-gray-200/60 blur-[100px]" />
          <div className="absolute bottom-0 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-gray-400/40 blur-[100px]" />
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300 border-none">
                Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
                Simple, Powerful Video Border Editing
              </h2>
              <p className="text-gray-600 max-w-[700px] mx-auto">
                Our editor makes it easy to add professional borders to your
                videos with an intuitive interface and powerful customization
                options.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle className="text-black">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300 border-none">
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
                Add Beautiful Borders in Three Simple Steps
              </h2>
              <p className="text-gray-600 max-w-[700px] mx-auto">
                Our streamlined process makes it easy to enhance your videos
                with professional borders in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Upload Your Video</h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your 1920x1080 video file into our uploader or
                  browse to select it.
                </p>
                <div className="mt-auto pt-4">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Customize Your Border
                </h3>
                <p className="text-gray-600 mb-4">
                  Adjust the thickness, color, and style of your border using
                  our intuitive controls.
                </p>
                <div className="mt-auto pt-4">
                  <Sliders className="h-12 w-12 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Export and Share</h3>
                <p className="text-gray-600 mb-4">
                  Download your video with the perfect border, ready to share on
                  any platform.
                </p>
                <div className="mt-auto pt-4">
                  <Download className="h-12 w-12 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link to="/editor">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Start Editing Your Video
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Border Styles Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300 border-none">
                Border Styles
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
                Choose Your Perfect Border Style
              </h2>
              <p className="text-gray-600 max-w-[700px] mx-auto">
                Explore our collection of border styles to find the perfect
                match for your content.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {borderStyles.map((style) => (
                <Card
                  key={style.id}
                  className="border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-lg hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="aspect-video relative">
                    <img
                      src={style.preview}
                      alt={style.name}
                      className="w-full h-full object-cover border-8 border-white"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-black">{style.name}</CardTitle>
                    <CardDescription>{style.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Try This Style
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300 border-none">
                Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
                Simple, Transparent Pricing
              </h2>
              <p className="text-gray-600 max-w-[700px] mx-auto">
                Choose the perfect plan for your video editing needs. All plans
                include access to our core features. No hidden fees or
                surprises.
              </p>
            </div>

            {error && (
              <div
                className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-6"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
                <button
                  className="absolute top-0 bottom-0 right-0 px-4 py-3"
                  onClick={() => setError("")}
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="flex flex-col h-full border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-lg hover:shadow-xl transition-all"
                >
                  <CardHeader className="pb-4">
                    <CardDescription className="text-sm text-gray-600">
                      {plan.interval_count === 1
                        ? "Monthly"
                        : `Every ${plan.interval_count} ${plan.interval}s`}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-black">
                        {formatCurrency(plan.amount, plan.currency)}
                      </span>
                      <span className="text-gray-600">/{plan.interval}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <Separator className="my-4 bg-gray-200" />
                    <ul className="space-y-3">
                      {getPlanFeatures(plan.product).map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start text-gray-700"
                        >
                          <CheckCircle2 className="h-5 w-5 text-black mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-black text-white hover:bg-gray-800"
                      onClick={() => handleCheckout(plan.id)}
                      disabled={isLoading}
                    >
                      {isLoading && processingPlanId === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe Now
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300 border-none">
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
                Loved by Content Creators
              </h2>
              <p className="text-gray-600 max-w-[700px] mx-auto">
                See what our users have to say about Video Border Editor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.avatar}`}
                          alt={testimonial.name}
                        />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base text-black">
                          {testimonial.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {testimonial.role} at {testimonial.company}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-black text-black"
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">{testimonial.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto">
            <div className="bg-gradient-to-r from-gray-100 to-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">
                  Ready to Transform Your Videos?
                </h2>
                <p className="text-lg md:text-xl mb-8 text-gray-600">
                  Join thousands of content creators who are already enhancing
                  their videos with professional borders.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/tempobook/storyboards/da71efbd-f795-49ff-874d-b3313df0fe4d?storyboard=true&type=COMPONENT&framework=VITE">
                    <Button
                      size="lg"
                      className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto"
                    >
                      Start Editing Free
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-gray-300 text-gray-700 hover:border-gray-500 hover:text-black w-full sm:w-auto"
                    >
                      View Examples
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link
                to="/"
                className="font-bold text-xl flex items-center mb-4 text-black"
              >
                <div className="relative h-5 w-5 mr-2">
                  <Camera className="h-5 w-5 text-black fill-black" />
                </div>
                BorderPost
              </Link>
              <p className="text-gray-600 mb-4">
                The simplest way to add professional borders to your videos and
                make your content stand out.
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-600 hover:text-black"
                >
                  <Github className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-600 hover:text-black"
                >
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-600 hover:text-black"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4 text-black">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Border Styles
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Examples
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4 text-black">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Video Guides
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4 text-black">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-black">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-200" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} BorderPost. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="#" className="text-sm text-gray-600 hover:text-black">
                Privacy
              </Link>
              <Link to="#" className="text-sm text-gray-600 hover:text-black">
                Terms
              </Link>
              <Link to="#" className="text-sm text-gray-600 hover:text-black">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
