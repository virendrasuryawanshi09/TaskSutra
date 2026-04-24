import React from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import DashboardLayout from "../../../components/layouts/DashboardLayout";

const ViewTaskDetails = () => {
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-4xl px-1 py-2 md:py-4">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text)]"
              >
                <HiOutlineArrowLeft className="text-base" />
                Back
              </button>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">
                  Header
                </h1>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Task Info</h2>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Checklist</h2>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Attachments</h2>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Activity / Query
            </h2>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewTaskDetails;
