"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle, Loader2, XCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface DetailedResult {
  id: number
  question: string
  answer: string
  userAnswer: string
  similarity: number
  marks: number
  [key: string]: any
}

export default function DetailedResultPage() {
  const [results, setResults] = useState<DetailedResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalMarks, setTotalMarks] = useState(0)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const resultId = params?.id as string
  const [subjectName, setSubjectName] = useState("")

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchDetailedResults()
  }, [router, resultId])

  const fetchDetailedResults = async () => {
    try {
      const response = await fetch(`http://localhost:5000/get_detailed_results?id=${resultId}`)
      const data = await response.json()

      if (response.ok) {
        const detailedResults = data.results || []
        const formattedResults = detailedResults.map((result: any) => ({
          id: result.id,
          question: result.question,
          answer: result.model_answer || result.answer, // Handle both field names
          userAnswer: result.user_answer || result.userAnswer, // Handle both field names
          similarity: result.similarity,
          marks: result.marks,
        }))
        setResults(formattedResults)

        // Calculate total marks
        const total = formattedResults.reduce((sum: number, result: DetailedResult) => sum + result.marks, 0)
        setTotalMarks(total)

        // Get subject name from the first result if available
        if (data.subject) {
          setSubjectName(data.subject.replace(".txt", ""))
        }
      } else {
        toast({
          title: "Error",
          description: data.Error || "Failed to fetch detailed results",
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

  const getScoreColor = (similarity: number) => {
    if (similarity >= 80) return "text-green-600"
    if (similarity >= 50) return "text-yellow-600"
    return "text-red-600"
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

  const generatePDF = () => {
    const email = localStorage.getItem("email") || "User"
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(18)
    doc.text("Test Results Report", 14, 22)

    // Add subject and email info
    doc.setFontSize(12)
    doc.text(`Subject: ${subjectName || "Unknown Subject"}`, 14, 32)
    doc.text(`Email: ${email}`, 14, 38)

    // Create table data
    const tableData = results.map((result, index) => [
      index + 1,
      result.question,
      result.userAnswer || "No answer provided",
      result.answer,
      `${result.similarity.toFixed(2)}%`,
      `${result.marks}/10`,
    ])

    // Add table
    autoTable(doc, {
      head: [["Sr. No", "Question", "User Answer", "Model Answer", "Similarity", "Marks"]],
      body: tableData,
      startY: 45,
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
      },
      didDrawPage: (data) => {
        // Add page number
        doc.setFontSize(10)
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10,
        )
      },
    })

    // Add total marks at the end
    const finalY = (doc as any).lastAutoTable.finalY || 45
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text(`Total Score: ${totalMarks} / ${results.length * 10}`, 14, finalY + 15)

    // Save the PDF
    doc.save(`${subjectName || "test"}_results.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 p-4">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => router.push("/results")} variant="ghost" className="mb-6 text-white hover:bg-white/20">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Detailed Results</h1>
            {!isLoading && (
              <Button
                onClick={generatePDF}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
          {!isLoading && (
            <p className="text-xl text-white opacity-90">
              Total Score: <span className="font-bold">{totalMarks}</span> / {results.length * 10}
            </p>
          )}
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {results.map((result, index) => (
              <motion.div key={index} variants={item}>
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-500">Question {index + 1}</span>
                      <div className="flex items-center">
                        <span className="font-bold mr-2">Score: {result.marks}/10</span>
                        {result.marks >= 7 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold mt-2">{result.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Answer:</h3>
                      <div className="p-4 bg-gray-100 rounded-md text-gray-800">
                        {result.userAnswer || <em className="text-gray-500">No answer provided</em>}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Model Answer:</h3>
                      <div className="p-4 bg-blue-50 rounded-md text-gray-800">{result.answer}</div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-medium">Similarity Score:</span>
                      <span className={`text-lg font-bold ${getScoreColor(result.similarity)}`}>
                        {result.similarity.toFixed(2)}%
                      </span>
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

