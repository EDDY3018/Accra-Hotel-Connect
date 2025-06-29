import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const payments: any[] = [];

export default function PaymentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Payment History</CardTitle>
        <CardDescription>A record of all your payments and outstanding balances.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No payment history found.</TableCell>
                </TableRow>
            ) : (
                payments.map((payment) => (
                  <TableRow key={payment.invoiceId}>
                    <TableCell className="font-medium">{payment.invoiceId}</TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "Paid" ? "default" : "destructive"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {payment.status === "Paid" ? (
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" /> Receipt
                            </Button>
                        ) : (
                             <Button size="sm">Pay Now</Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
