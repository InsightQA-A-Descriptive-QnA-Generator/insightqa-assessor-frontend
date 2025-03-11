"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface TestResult {
  id: number
  email: string
  subject: string
  date: string
  [key: string]: any
}

export default function ResultsPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const email = localStorage.getItem("email")
    if (!token || !email) {
      router.push("/login")
      return
    }

    fetchResults(email)
  }, [router])

  const fetchResults = async (email: string) => {
    try {
      const response = await fetch(`http://localhost:5000/get_results_list?email=${email}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
      } else {
        toast({
          title: "Error",
          description: data.Error || "Failed to fetch results",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewResult = (resultId: number) => {
    router.push(`/results/${resultId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 p-4">
      <div className="max-w-6xl mx-auto">
        <Button onClick={() => router.push("/")} variant="ghost" className="mb-6 text-white hover:bg-white/20">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">Your Test Results</h1>
          <p className="text-xl text-white opacity-90">View your past test results</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-white text-xl">You haven&apos;t taken any tests yet.</div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {results.map((result) => (
              <motion.div key={result.id} variants={item}>
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm h-full">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2" />
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <FileText className="h-10 w-10 text-blue-500" />
                        <div className="flex items-center text-sm font-medium text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(result.date)}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2 capitalize">{result.subject.replace(".txt", "")}</h3>
                      <p className="text-gray-600 mb-6">View your detailed results and feedback</p>
                      <Button
                        onClick={() => handleViewResult(result.id)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        View Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

