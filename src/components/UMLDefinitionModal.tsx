
import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UMLDefinitionModalProps {
  open: boolean;
  onClose: () => void;
}

const UML_DEF = [
  { term: "Entity/Class", desc: "A distinct object or concept in your system, such as Student, Professor, or Course." },
  { term: "Attribute", desc: "A property of an entity (e.g., Student.name, Course.credits)." },
  { term: "Method", desc: "An action that the entity can perform (e.g., Student.enrollCourse())." },
  { term: "Relationship", desc: "A defined connection between entities (e.g., Student enrolls in Course)." }
];

export default function UMLDefinitionModal({ open, onClose }: UMLDefinitionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.scrollTop = 0;
      setScrolledToBottom(false);
    }
  }, [open]);

  const handleScroll = () => {
    if (!modalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = modalRef.current;
    if (scrollTop + clientHeight + 10 >= scrollHeight) {
      setScrolledToBottom(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What is a Valid UML Diagram?</DialogTitle>
          <DialogDescription>
            <div
              ref={modalRef}
              onScroll={handleScroll}
              style={{ maxHeight: 260, overflowY: "auto" }}
              className="my-2 pr-2"
              tabIndex={-1}
            >
              <p className="mb-3">
                A valid UML diagram must describe a system with:
              </p>
              <ul className="list-disc ml-5 mb-3">
                <li><b>At least two entities/classes,</b> each having:</li>
                <ul className="list-[circle] ml-6">
                  <li>At least <b>one attribute</b></li>
                  <li>At least <b>one method</b></li>
                </ul>
                <li>
                  <b>At least one relationship</b> connecting two entities
                </li>
                <li>
                  <b>And mention certain required words:</b>
                  <ul className="list-[square] ml-6">
                    <li><i>attribute</i></li>
                    <li><i>method</i></li>
                    <li><i>relationship</i></li>
                    <li><i>entity</i> or <i>class</i></li>
                  </ul>
                </li>
              </ul>
              <hr className="my-2" />
              <div>
                <b>Quick Definitions:</b>
                <ul className="mt-2">
                  {UML_DEF.map((item) => (
                    <li key={item.term} className="mb-1">
                      <b>{item.term}:</b> <span>{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Button disabled={!scrolledToBottom} className="w-full mt-2" onClick={onClose}>
          {scrolledToBottom ? "I understand" : "Scroll to bottom to continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
