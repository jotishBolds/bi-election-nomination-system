// components/nomination/consent-page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, AlertTriangle, ScrollText } from "lucide-react";

interface ConsentPageProps {
  onAccept: () => void;
  onBack: () => void;
}

export function ConsentPage({ onAccept, onBack }: ConsentPageProps) {
  const [mainConsent, setMainConsent] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // Check if scrolled to bottom (with 10px threshold for better UX)
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToEnd(true);
    }
  };

  const canProceed = mainConsent && hasScrolledToEnd;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-primary-light to-white p-4 md:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="mx-auto">
            <img
              src="/main-logo-new.png"
              alt="Declaration & Consent"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary">
            Declaration & Consent
          </h1>
          <p className="text-muted-foreground">
            Please read all terms and conditions before proceeding
          </p>
        </motion.div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScrollText className="h-5 w-5 text-primary" />
              Terms and Conditions
            </CardTitle>
            <CardDescription>
              Online Nomination Filing – Municipal Election
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasScrolledToEnd && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2"
              >
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Please scroll through and read all terms and conditions to
                  enable the consent checkbox
                </p>
              </motion.div>
            )}

            <ScrollArea
              className="h-[400px] pr-4 border rounded-lg p-4"
              onScrollCapture={handleScroll}
              ref={scrollAreaRef}
            >
              <div className="space-y-4 text-sm leading-relaxed">
                <h3 className="font-bold text-base text-primary uppercase">
                  TERMS AND CONDITIONS
                </h3>
                <p className="font-semibold">
                  (Online Nomination Filing – Municipal Election)
                </p>

                <ol className="space-y-3 list-decimal list-inside">
                  <li>
                    This Online Nomination Filing Portal is provided for filing
                    nomination forms under the Sikkim Municipalities (Conduct of
                    Election) Rules, 2007 framed under section 364(1) of the
                    Sikkim Municipalities Act, 2007.
                  </li>

                  <li>
                    All nominations filed through this portal shall be governed
                    strictly by the provisions of the Act and the Election Rules
                    and shall be subject to the superintendence, direction and
                    control of the State Election Commission under Rule 3.
                  </li>

                  <li>
                    Only a person whose name appears in the electoral roll of
                    the concerned Municipal ward and who is not disqualified
                    shall be eligible to file nomination, as provided under Rule
                    24 read with Rule 2(1)(i).
                  </li>

                  <li>
                    The nomination form shall be submitted in the prescribed
                    Form-18 as required under Rule 25(3).
                  </li>

                  <li>
                    The nomination paper shall be delivered within the date,
                    time and place specified in the public notice issued under
                    Rule 22 and within the last date fixed under Rule 21(a).
                  </li>

                  <li>
                    The nomination paper must be signed by the candidate and by
                    one proposer who is an elector of the same Municipal ward,
                    as required under Rule 25(1) and Rule 25(2).
                  </li>

                  <li>
                    A candidate may submit more than one nomination paper for
                    the same ward, as permitted under Rule 25(4), but not more
                    than one security deposit shall be required under Rule 26(1)
                    proviso.
                  </li>

                  <li>
                    A security deposit shall be made at the time of filing
                    nomination as prescribed under Rule 26(1), being ₹500 for
                    General category candidates and ₹250 for SC/ST/MBC/OBC
                    candidates.
                  </li>

                  <li>
                    The security deposit shall be made in the manner prescribed
                    under Rule 26(2), and nomination shall not be deemed duly
                    nominated unless such deposit is made in compliance with
                    Rule 26(1).
                  </li>

                  <li>
                    In case of nomination for a reserved seat, the candidate
                    shall enclose a valid caste or category certificate issued
                    by the competent authority as required under Rule 25(5).
                  </li>

                  <li>
                    All nomination papers shall be scrutinized on the date fixed
                    under Rule 21(b), and the Municipal Returning Officer shall
                    examine and decide upon objections under Rule 28(1) and Rule
                    28(2).
                  </li>

                  <li>
                    The Municipal Returning Officer may reject a nomination on
                    the grounds specified under Rule 28(2)(a), (b), (c), (d),
                    and (e), including disqualification, improper proposer,
                    non-compliance with Rules 25 and 26, non-genuine signatures,
                    or absence of required certificate.
                  </li>

                  <li>
                    The decision of the Municipal Returning Officer accepting or
                    rejecting a nomination shall be recorded under Rule 28(6),
                    and only candidates whose nominations are found valid shall
                    be included in the list prepared under Rule 28(8).
                  </li>

                  <li>
                    Submission of nomination through this online portal shall
                    not confer the status of contesting candidate unless the
                    nomination is found valid upon scrutiny under Rule 28.
                  </li>

                  <li>
                    A candidate may withdraw his or her candidature in writing
                    within the time prescribed under Rule 21(c) and in the
                    manner provided under Rule 29(1), and such withdrawal once
                    made shall not be cancelled as per Rule 29(2).
                  </li>

                  <li>
                    The security deposit shall be forfeited if, at an election
                    where a poll has been taken, the candidate is not elected
                    and fails to secure more than one-sixth of the total valid
                    votes polled, as provided under Rule 26(6).
                  </li>

                  <li>
                    The security deposit shall be returned in the circumstances
                    and manner provided under Rule 26(3), Rule 26(4), and Rule
                    26(5).
                  </li>

                  <li>
                    The candidate shall be solely responsible for ensuring that
                    all information submitted is true, correct and complete, and
                    any false declaration may result in rejection of nomination
                    under Rule 28(2) and other consequences under law.
                  </li>

                  <li>
                    The nomination must be submitted before the last date fixed
                    under Rule 21(a), and no nomination shall be accepted after
                    the prescribed deadline.
                  </li>

                  <li>
                    This online portal facilitates submission of nomination;
                    however, all statutory powers relating to scrutiny,
                    acceptance, rejection, withdrawal, preparation of list of
                    contesting candidates under Rule 31, and allotment of
                    symbols under Rule 31(4) shall vest with the Municipal
                    Returning Officer and the State Election Commission.
                  </li>

                  <li>
                    In case of any inconsistency between information submitted
                    online and official electoral roll records, the electoral
                    roll prepared under Rule 8 shall prevail.
                  </li>

                  <li>
                    All matters relating to the election process shall be
                    governed strictly by the Sikkim Municipalities Act, 2007 and
                    the Sikkim Municipalities (Conduct of Election) Rules, 2007.
                  </li>
                </ol>

                <div className="mt-6 pt-4 border-t text-center text-primary font-semibold">
                  ✓ End of Terms and Conditions
                </div>
              </div>
            </ScrollArea>

            <div
              className={`mt-6 p-4 rounded-lg border-2 transition-all duration-300 ${
                hasScrolledToEnd
                  ? "bg-primary/5 border-primary/20"
                  : "bg-gray-50 border-gray-200 opacity-50"
              }`}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="main-consent"
                  checked={mainConsent}
                  onCheckedChange={(checked) =>
                    setMainConsent(checked as boolean)
                  }
                  disabled={!hasScrolledToEnd}
                  className="mt-1"
                />
                <label
                  htmlFor="main-consent"
                  className={`text-sm font-medium ${
                    hasScrolledToEnd ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  I have read, understood, and agree to all the above terms and
                  conditions. I declare that all information provided is true
                  and correct to the best of my knowledge. I wish to proceed
                  with my nomination application.
                </label>
              </div>
            </div>

            {hasScrolledToEnd && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-green-600 flex items-center gap-2"
              >
                <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                You have read all terms and conditions
              </motion.div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              className="bg-primary hover:bg-primary-hover"
              disabled={!canProceed}
              onClick={onAccept}
            >
              Proceed to Form
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
}
