import React, { Fragment, forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
import moment from "moment";
import { HiCalendarDays, HiCheck, HiChevronUpDown } from "react-icons/hi2";

const PriorityButton = ({ value }) => {
  const priorityColor =
    value === "Low" ? "text-green-500" : value === "Medium" ? "text-blue-500" : "text-orange-500";

  return <span className={`font-medium ${priorityColor}`}>{value}</span>;
};

const DateInputButton = forwardRef(
  ({ value, onChange, onBlur, onIconClick, placeholder = "dd-mm-yyyy" }, ref) => (
    <div className="relative w-full">
      <input
        ref={ref}
        type="text"
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className="
          w-full
          min-h-[42px]
          bg-[var(--bg-soft)]
          border border-[var(--border)]
          rounded-lg
          px-3 py-2 pr-10
          text-sm text-[var(--text)]
          placeholder:text-[var(--text-muted)]
          outline-none
          transition-all duration-200
          focus:border-[var(--accent)]
          focus:bg-transparent
          focus:shadow-[0_0_0_1px_var(--accent)]
        "
      />

      <button
        type="button"
        onClick={onIconClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
        tabIndex={-1}
        aria-label="Open calendar"
      >
        <HiCalendarDays className="h-4 w-4" />
      </button>
    </div>
  )
);

DateInputButton.displayName = "DateInputButton";

const SelectDropdown = ({ type = "select", label, options = [], value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const selectedDate = useMemo(() => {
    if (type !== "date" || !value) return null;

    const parsedDate = moment(value, ["YYYY-MM-DD", "DD-MM-YYYY"], true);
    return parsedDate.isValid() ? parsedDate.toDate() : null;
  }, [type, value]);

  useEffect(() => {
    if (!isOpen) return;

    const updateMenuPosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();

      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 90,
      });
    };

    const handlePointerDown = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (type === "date") {
    return (
      <div className="group">
        {label && (
          <label className="block text-xs text-[var(--text-muted)] mb-1">
            {label}
          </label>
        )}

        <DatePicker
          open={isDatePickerOpen}
          selected={selectedDate}
          onChange={(date) => {
            onChange(date ? moment(date).format("YYYY-MM-DD") : null);
            setIsDatePickerOpen(false);
          }}
          onClickOutside={() => setIsDatePickerOpen(false)}
          onSelect={() => setIsDatePickerOpen(false)}
          onChangeRaw={(event) => {
            onChange(event.target.value);
          }}
          onInputClick={(event) => {
            event.preventDefault();
          }}
          preventOpenOnFocus
          dateFormat="dd-MM-yyyy"
          customInput={<DateInputButton onIconClick={() => setIsDatePickerOpen((prev) => !prev)} />}
          onBlur={() => {
            if (!value) return;

            const parsedDate = moment(value, ["DD-MM-YYYY", "YYYY-MM-DD"], true);
            if (parsedDate.isValid()) {
              onChange(parsedDate.format("YYYY-MM-DD"));
            }
          }}
          popperPlacement="bottom-end"
          calendarClassName="tasksutra-datepicker"
          popperClassName="tasksutra-datepicker-popper"
          wrapperClassName="block w-full"
          showPopperArrow={false}
        />
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-xs text-[var(--text-muted)] mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="
            w-full
            bg-[var(--bg-soft)]
            border border-[var(--border)]
            rounded-lg
            px-3 py-2
            text-sm text-left
            outline-none

            transition-all duration-200
            focus:border-[var(--accent)]
            focus:shadow-[0_0_0_1px_var(--accent)]
          "
        >
          <PriorityButton value={value} />

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <HiChevronUpDown className="w-4 h-4" />
          </span>
        </button>

        {typeof document !== "undefined" &&
          createPortal(
            <Transition
              as={Fragment}
              show={isOpen}
              enter="transition duration-200 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition duration-200 ease-out"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div
                ref={menuRef}
                style={menuStyle}
                className="
                  overflow-hidden rounded-lg border border-[var(--border)]
                  bg-[var(--surface)] p-1 shadow-[0_10px_30px_rgba(15,23,42,0.10)]
                  outline-none
                "
              >
                {options.map((item) => {
                  const selected = value === item.label;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        onChange(item.label);
                        setIsOpen(false);
                      }}
                      className={`
                        flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm
                        transition-colors duration-200 hover:bg-[var(--bg-soft)]
                        ${selected ? "bg-[var(--bg-soft)] text-[var(--text)]" : "text-[var(--text)]"}
                      `}
                    >
                      <span>{item.label}</span>
                      {selected && <HiCheck className="h-4 w-4 text-[var(--accent)]" />}
                    </button>
                  );
                })}
              </div>
            </Transition>,
            document.body
          )}
      </div>
    </div>
  );
};

export default SelectDropdown;
