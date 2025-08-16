"use client"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Smartphone,
  MessageSquare,
  Phone,
  Shield,
  Users,
  MapPin,
  Star,
  CheckCircle,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user is admin and redirect to admin dashboard
      const userRole = (session?.user as any)?.role
      if (userRole === 'admin' || userRole === 'superadmin') {
        router.replace("/admin")
      } else {
        router.replace("/dashboard")
      }
    }
  }, [status, router, session])

  if (status === "authenticated") {
    return null // or a loading spinner
  }

  const features = [
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Real-Time Market Prices",
      description: "Get current prices from multiple markets across Uganda, updated every 30 minutes",
    },
    {
      icon: <Smartphone className="h-8 w-8 text-blue-600" />,
      title: "Multi-Channel Access",
      description: "Access via mobile app, SMS, or USSD - no internet required for basic features",
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Direct Trading",
      description: "Connect directly with buyers and eliminate middlemen to get better prices",
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      title: "Secure Payments",
      description: "Safe transactions through MTN Mobile Money and Airtel Money integration",
    },
  ]

  const testimonials = [
    {
      name: "John Mukasa",
      location: "Kampala, Central",
      role: "Maize Farmer",
      content: "FarmMarket helped me increase my income by 40%. I now know exactly when and where to sell my crops.",
      rating: 5,
    },
    {
      name: "Sarah Namuli",
      location: "Mbale, Eastern",
      role: "Bean Farmer",
      content: "The weather alerts saved my harvest last season. The community support is incredible.",
      rating: 5,
    },
    {
      name: "David Kiwanuka",
      location: "Mukono, Central",
      role: "Coffee Farmer",
      content: "Direct connection with buyers means better prices and faster payments. Highly recommended!",
      rating: 5,
    },
  ]

  const pricingPlans = [
    {
      name: "Basic",
      price: "Free",
      description: "Essential market information",
      features: ["Daily market prices", "Basic weather updates", "Community access"],
    },
    {
      name: "Premium",
      price: "UGX 10,000/month",
      description: "Advanced features for serious farmers",
      features: [
        "Everything in Basic",
        "SMS price alerts",
        "Advanced weather forecasts",
        "Buyer & Seller Marketplace",
        "Expert agricultural advice",
        "Priority customer support",
      ],
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Today's Prices - appears first on mobile, second on desktop */}
            <div className="relative order-1 lg:order-2 mb-12 lg:mb-0">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Today's Prices</h3>
                    <Badge className="bg-green-100 text-green-800">Live</Badge>
                  </div>
                  {[
                    { crop: "Maize", price: "2,500", change: "+5%" },
                    { crop: "Beans", price: "4,200", change: "-2%" },
                    { crop: "Coffee", price: "8,500", change: "+12%" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium">{item.crop}</span>
                      <div className="text-right">
                        <div className="font-bold">UGX {item.price}</div>
                        <div className={`text-sm ${item.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                          {item.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Hero Text - appears second on mobile, first on desktop */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <Badge className="mb-4 bg-green-100 text-green-800">Empowering Ugandan Farmers</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Get Better Prices for Your <span className="text-green-600">Crops</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Access real-time market prices, connect directly with buyers, and get expert agricultural advice.
                Available via mobile app, SMS, and USSD across Uganda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link href="/register">
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
                  <Link href="/prices">View Market Prices</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Free to start
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Works on any phone
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  No internet required
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center lg:text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600 lg:max-w-3xl lg:mx-auto">
              Our platform provides comprehensive tools and information to help Ugandan farmers make informed decisions
              and increase their income.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Channel Access */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center lg:text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Access Anywhere, Anytime</h2>
            <p className="text-xl text-gray-600">Choose the method that works best for you - no smartphone required</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Mobile App</CardTitle>
                <CardDescription>Full features with visual charts and detailed information</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Interactive price charts</li>
                  <li>• Photo-based crop listings</li>
                  <li>• Real-time notifications</li>
                  <li>• Community discussions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>SMS</CardTitle>
                <CardDescription>Essential information delivered via text message</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Daily price updates</li>
                  <li>• Weather alerts</li>
                  <li>• Market notifications</li>
                  <li>• Works on any phone</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Phone className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>USSD</CardTitle>
                <CardDescription>Menu-driven access without internet connection</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Dial *123# to access</li>
                  <li>• Check current prices</li>
                  <li>• Submit market data</li>
                  <li>• No data charges</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center lg:text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by Farmers Across Uganda</h2>
            <p className="text-xl text-gray-600">See how FarmMarket is helping farmers increase their income</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-green-600 font-semibold">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center lg:text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Start free and upgrade when you're ready for advanced features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? "border-green-500 shadow-lg" : ""}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-green-600 my-4">{plan.price}</div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? "" : "bg-transparent"}`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/register">{plan.name === "Basic" ? "Start Free" : "Start Premium Trial"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Increase Your Farm Income?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Ugandan farmers who are already using FarmMarket to get better prices for their crops.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8" asChild>
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 bg-transparent"
              asChild
            >
              <Link href="/prices">View Market Prices</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">FarmMarket</h3>
              <p className="text-gray-400">
                Empowering Ugandan farmers with real-time market information and direct trading opportunities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/prices" className="hover:text-white">
                    Market Prices
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="hover:text-white">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="hover:text-white">
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="/weather" className="hover:text-white">
                    Weather
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/sms-guide" className="hover:text-white">
                    SMS Guide
                  </Link>
                </li>
                <li>
                  <Link href="/ussd-guide" className="hover:text-white">
                    USSD Guide
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Access Methods</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📱 Mobile App</li>
                <li>💬 SMS: Text "PRICE" to 6789</li>
                <li>☎️ USSD: Dial *123#</li>
                <li>🌐 Web: farmmarket.ug</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FarmMarket Uganda. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
