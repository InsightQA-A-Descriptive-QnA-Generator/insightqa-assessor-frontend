"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function TestsPage() {
  const [subjects, setSubjects] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchSubjects()
  }, [router])

  const fetchSubjects = async () => {
    try {
      const response = await fetch("http://localhost:5000/subjects")
      const data = await response.json()

      if (response.ok) {
        setSubjects(data.subjects || [])
      } else {
        toast({
          title: "Error",
          description: data.Error || "Failed to fetch subjects",
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

  const handleStartTest = (subject: string) => {
    router.push(`/tests/${subject}`)
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">Available Tests</h1>
          <p className="text-xl text-white opacity-90">Select a subject to start your test</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center text-white text-xl">No tests available at the moment.</div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {subjects.map((subject, index) => (
              <motion.div key={index} variants={item}>
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm h-full">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2" />
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <BookOpen className="h-10 w-10 text-purple-500" />
                        <span className="text-sm font-medium text-gray-500">10 Questions</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2 capitalize">{subject}</h3>
                      <p className="text-gray-600 mb-6">Test your knowledge in {subject}</p>
                      <Button
                        onClick={() => handleStartTest(subject)}
                        className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                      >
                        Start Test
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

