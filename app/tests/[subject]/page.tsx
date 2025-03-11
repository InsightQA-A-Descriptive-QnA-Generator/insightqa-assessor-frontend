"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { sub } from "date-fns"

interface Question {
  id: number
  question: string
  answer: string
  userAnswer?: string
}

export default function TestPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  let subject = params?.subject as string
  subject = decodeURIComponent(subject) + ".txt"

  useEffect(() => {
    const token = localStorage.getItem("token")
    const email = localStorage.getItem("email")
    if (!token || !email) {
      router.push("/login")
      return
    }

    fetchQuestions()
  }, [router, subject])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/questions_and_answers?subject=${subject}`)
      const data = await response.json()
      console.log(data)
      if (response.ok) {
        const questionsData = data.questions_and_answers || []
        setQuestions(
          questionsData.map((q: any) => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            userAnswer: "",
          })),
        )
      } else {
        toast({
          title: "Error",
          description: data.Error || "Failed to fetch questions",
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

  const handleUserAnswerChange = (answer: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].userAnswer = answer
    setQuestions(updatedQuestions)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    const email = localStorage.getItem("email")
    console.log(subject)
    if (!email) {
      toast({
        title: "Error",
        description: "You need to be logged in to submit the test",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const questionsAndAnswers = questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        userAnswer: q.userAnswer || "",
      }))

      const response = await fetch("http://localhost:5000/evaluate_questions_and_answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions_and_answers: questionsAndAnswers,
          email,
          subject,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Test submitted successfully!",
        })
        router.push("/results")
      } else {
        toast({
          title: "Error",
          description: data.Error || "Failed to submit test",
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
      setIsSubmitting(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 p-4">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => router.push("/tests")} variant="ghost" className="mb-6 text-white hover:bg-white/20">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg capitalize">{subject.slice(0, -4)} Test</h1>
          <p className="text-xl text-white opacity-90">Answer all questions to the best of your ability</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-500">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {Math.floor((currentQuestionIndex / questions.length) * 100)}% Complete
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-bold mt-4">{currentQuestion?.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <label htmlFor="answer" className="text-lg font-medium">
                      Your Answer:
                    </label>
                    <Textarea
                      id="answer"
                      value={currentQuestion?.userAnswer || ""}
                      onChange={(e) => handleUserAnswerChange(e.target.value)}
                      placeholder="Type your answer here..."
                      className="min-h-[200px] text-lg p-4"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="text-lg px-6 py-5"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="text-lg px-6 py-5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Submit Test
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="text-lg px-6 py-5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-full p-0 ${
                  index === currentQuestionIndex ? "bg-white text-purple-600" : "bg-white/50 text-purple-800"
                } ${questions[index]?.userAnswer ? "ring-2 ring-green-500" : ""}`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

