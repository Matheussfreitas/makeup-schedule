"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BellIcon,
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  MagicWand01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const TIME_ZONE = "America/Sao_Paulo";
const BRAZIL_OFFSET = "-03:00";
const YEAR = 2026;
const INITIAL_DATE = "2026-09-05";
const INITIAL_TIME = "10:30";

const months = [
  { name: "Janeiro", short: "Jan", days: 31 },
  { name: "Fevereiro", short: "Fev", days: 28 },
  { name: "Março", short: "Mar", days: 31 },
  { name: "Abril", short: "Abr", days: 30 },
  { name: "Maio", short: "Mai", days: 31 },
  { name: "Junho", short: "Jun", days: 30 },
  { name: "Julho", short: "Jul", days: 31 },
  { name: "Agosto", short: "Ago", days: 31 },
  { name: "Setembro", short: "Set", days: 30 },
  { name: "Outubro", short: "Out", days: 31 },
  { name: "Novembro", short: "Nov", days: 30 },
  { name: "Dezembro", short: "Dez", days: 31 },
];

const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const weekdayShort = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

const timeSlots = [
  { value: "09:00", label: "09:00 AM", duration: 90 },
  { value: "10:30", label: "10:30 AM", duration: 90 },
  { value: "13:00", label: "01:00 PM", duration: 90 },
  { value: "14:30", label: "02:30 PM", duration: 90, booked: true },
  { value: "16:00", label: "04:00 PM", duration: 90 },
];

type CalendarCell = {
  key: string;
  date: string;
  day: number;
  muted: boolean;
  marked: boolean;
};

type Appointment = {
  date: string;
  time: string;
  timestamp: string;
  timezone: typeof TIME_ZONE;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateId(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function getWeekday(year: number, monthIndex: number, day: number) {
  const month = monthIndex + 1;
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const adjustedYear = month < 3 ? year - 1 : year;

  return (
    adjustedYear +
    Math.floor(adjustedYear / 4) -
    Math.floor(adjustedYear / 100) +
    Math.floor(adjustedYear / 400) +
    offsets[month - 1] +
    day
  ) % 7;
}

function parseDateId(dateId: string) {
  const [year, month, day] = dateId.split("-").map(Number);

  return {
    year,
    monthIndex: month - 1,
    day,
  };
}

function buildCalendarCells(monthIndex: number): CalendarCell[] {
  const currentMonth = months[monthIndex];
  const previousMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const previousYear = monthIndex === 0 ? YEAR - 1 : YEAR;
  const currentYear = YEAR;
  const firstWeekday = getWeekday(currentYear, monthIndex, 1);
  const previousMonthDays = months[previousMonthIndex].days;
  const cells: CalendarCell[] = [];

  for (let index = firstWeekday; index > 0; index -= 1) {
    const day = previousMonthDays - index + 1;
    cells.push({
      key: `previous-${day}`,
      date: toDateId(previousYear, previousMonthIndex, day),
      day,
      muted: true,
      marked: false,
    });
  }

  for (let day = 1; day <= currentMonth.days; day += 1) {
    cells.push({
      key: `current-${day}`,
      date: toDateId(currentYear, monthIndex, day),
      day,
      muted: false,
      marked: day === 1 || day === 2,
    });
  }

  const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
  const nextYear = monthIndex === 11 ? YEAR + 1 : YEAR;
  let nextDay = 1;

  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({
      key: `next-${nextDay}`,
      date: toDateId(nextYear, nextMonthIndex, nextDay),
      day: nextDay,
      muted: true,
      marked: false,
    });
    nextDay += 1;
  }

  return cells;
}

function formatDateLabel(dateId: string) {
  const { year, monthIndex, day } = parseDateId(dateId);
  const weekday = weekdays[getWeekday(year, monthIndex, day)];

  return `${weekday}, ${months[monthIndex].short} ${day}, ${year}`;
}

function getTimeLabel(time: string) {
  return timeSlots.find((slot) => slot.value === time)?.label ?? time;
}

function getDuration(time: string) {
  return timeSlots.find((slot) => slot.value === time)?.duration ?? 90;
}

function buildBrazilCivilTimestamp(date: string, time: string) {
  return `${date}T${time}:00${BRAZIL_OFFSET}`;
}

function DetailIcon({
  icon,
  className,
}: {
  icon: typeof Calendar03Icon;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      icon={icon}
      size={18}
      strokeWidth={1.7}
      className={cn("shrink-0", className)}
    />
  );
}

export function BookingScheduler() {
  const [monthIndex, setMonthIndex] = useState(8);
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);
  const [selectedTime, setSelectedTime] = useState(INITIAL_TIME);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  const calendarCells = useMemo(() => buildCalendarCells(monthIndex), [monthIndex]);
  const selectedDateLabel = formatDateLabel(selectedDate);
  const selectedTimeLabel = selectedTime ? getTimeLabel(selectedTime) : "Select a time";
  const selectedTimestamp = selectedTime
    ? buildBrazilCivilTimestamp(selectedDate, selectedTime)
    : "";

  function handleDateSelect(date: string, muted: boolean) {
    const parsed = parseDateId(date);

    if (muted && parsed.year !== YEAR) {
      return;
    }

    setSelectedDate(date);
    setConfirmedAppointment(null);

    if (muted && parsed.year === YEAR) {
      setMonthIndex(parsed.monthIndex);
    }

    if (date !== selectedDate || timeSlots.some((slot) => slot.value === selectedTime && slot.booked)) {
      setSelectedTime("");
    }
  }

  function handleMonthChange(direction: "previous" | "next") {
    setConfirmedAppointment(null);
    setMonthIndex((current) => {
      if (direction === "previous") {
        return current === 0 ? 11 : current - 1;
      }

      return current === 11 ? 0 : current + 1;
    });
  }

  function handleTimeChange(value: string[]) {
    setSelectedTime(value[0] ?? "");
    setConfirmedAppointment(null);
  }

  function handleConfirm() {
    if (!selectedDate || !selectedTime) {
      return;
    }

    setConfirmedAppointment({
      date: selectedDate,
      time: selectedTime,
      timestamp: buildBrazilCivilTimestamp(selectedDate, selectedTime),
      timezone: TIME_ZONE,
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f2ed] text-[#3f3334]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col p-3 sm:p-5 lg:p-6">
        <section className="relative flex flex-1 overflow-hidden rounded-lg bg-[#fffcf8] shadow-[0_24px_80px_rgba(84,62,58,0.13)] ring-1 ring-[#eaded4]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(244,210,205,0.48),transparent_30%),radial-gradient(circle_at_86%_82%,rgba(205,224,215,0.5),transparent_34%)]" />
          <div className="relative flex w-full flex-col">
            <header className="flex items-center justify-between border-b border-[#eee4dc] bg-white/72 px-5 py-4 backdrop-blur sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-[#ead1ca] text-[#6e5558]">
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={MagicWand01Icon}
                    size={18}
                    strokeWidth={1.8}
                  />
                </div>
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-normal text-[#725c60]">
                  Layza Makeup
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  aria-label="Notifications"
                  size="icon-sm"
                  variant="ghost"
                  className="rounded-md text-[#67575a] hover:bg-[#f2e8e1]"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={BellIcon}
                    size={18}
                    strokeWidth={1.7}
                  />
                </Button>
                <Avatar size="sm" className="ring-2 ring-[#ead1ca]">
                  <AvatarFallback className="bg-[#705a5e] text-[10px] font-semibold text-[#fff8f1]">
                    LM
                  </AvatarFallback>
                </Avatar>
              </div>
            </header>

            <div className="grid flex-1 grid-cols-1 gap-6 px-5 py-9 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-7 lg:px-12 lg:py-12">
              <section className="flex flex-col justify-center gap-7">
                <div className="max-w-2xl">
                  <h1 className="max-w-2xl font-[family-name:var(--font-display)] text-5xl font-bold leading-[0.95] tracking-normal text-[#725c60] sm:text-6xl">
                    Faça sua reserva
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-[#77686a] sm:text-base">
                    Garanta sua experiência de beleza. Selecione uma data e hora adequadas ao seu estilo de vida.
                  </p>
                </div>

                <Card className="rounded-lg border-0 bg-white/86 shadow-[0_18px_55px_rgba(99,75,67,0.08)] ring-[#eaded4] [--card-spacing:--spacing(5)]">
                  <CardHeader className="gap-1 sm:px-7">
                    <CardTitle className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#3f3334]">
                      {months[monthIndex].name} {YEAR}
                    </CardTitle>
                    <CardDescription>
                      Escolha o dia que funciona melhor para você.
                    </CardDescription>
                    <CardAction className="flex gap-2">
                      <Button
                        aria-label="Previous month"
                        size="icon-sm"
                        variant="outline"
                        className="rounded-md border-[#e4d7cf] bg-white text-[#6f5b5e]"
                        onClick={() => handleMonthChange("previous")}
                      >
                        <HugeiconsIcon
                          aria-hidden="true"
                          icon={ArrowLeft01Icon}
                          size={16}
                          strokeWidth={1.8}
                        />
                      </Button>
                      <Button
                        aria-label="Next month"
                        size="icon-sm"
                        variant="outline"
                        className="rounded-md border-[#e4d7cf] bg-white text-[#6f5b5e]"
                        onClick={() => handleMonthChange("next")}
                      >
                        <HugeiconsIcon
                          aria-hidden="true"
                          icon={ArrowRight01Icon}
                          size={16}
                          strokeWidth={1.8}
                        />
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="sm:px-7">
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {weekdayShort.map((weekday) => (
                        <div
                          key={weekday}
                          className="text-[10px] font-bold tracking-wider text-[#9b8989]"
                        >
                          {weekday}
                        </div>
                      ))}
                      {calendarCells.map((date) => {
                        const isSelected = date.date === selectedDate;

                        return (
                          <button
                            key={date.key}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handleDateSelect(date.date, date.muted)}
                            className={cn(
                              "relative flex h-11 items-center justify-center rounded-md text-sm font-medium text-[#465052] transition",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6b73]/40",
                              date.muted && "text-[#cfc5c0]",
                              isSelected &&
                                "bg-[#7a666a] text-white shadow-[0_10px_24px_rgba(122,102,106,0.28)]",
                              !isSelected &&
                                !date.muted &&
                                "hover:bg-[#f4e7e1]",
                              !isSelected &&
                                date.muted &&
                                "hover:bg-[#fbf4ef]"
                            )}
                          >
                            {date.day}
                            {date.marked ? (
                              <span className="absolute bottom-2 size-1 rounded-full bg-[#6f8780]" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-end gap-2">
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#3f3334]">
                      Horários Disponíveis
                    </h2>
                    <p className="pb-1 text-xs font-medium text-[#917e7d]">
                      para {months[parseDateId(selectedDate).monthIndex].short}{" "}
                      {parseDateId(selectedDate).day}
                    </p>
                  </div>
                  <ToggleGroup
                    aria-label="Available appointment times"
                    value={selectedTime ? [selectedTime] : []}
                    onValueChange={handleTimeChange}
                    className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
                  >
                    {timeSlots.map((slot) => {
                      const isSelected = selectedTime === slot.value;

                      return (
                        <ToggleGroupItem
                          key={slot.value}
                          value={slot.value}
                          disabled={slot.booked}
                          aria-label={`${slot.label} ${slot.booked ? "booked" : "available"}`}
                          className={cn(
                            "flex min-h-16 w-full flex-col rounded-md border bg-white px-3 text-center text-sm font-bold shadow-sm transition",
                            "border-[#e4d7cf] text-[#27373c] hover:border-[#b79097] hover:bg-[#fff6f2]",
                            "data-[pressed]:border-[#8a6b73] data-[pressed]:bg-[#f4dce3] data-[pressed]:text-[#7a5660] data-[pressed]:shadow-[0_10px_22px_rgba(122,86,96,0.18)]",
                            slot.booked &&
                              "cursor-not-allowed border-[#eee8e3] bg-[#fbf8f5] text-[#bfb5b1] shadow-none hover:border-[#eee8e3] hover:bg-[#fbf8f5]",
                            isSelected &&
                              "border-[#8a6b73] bg-[#f4dce3] text-[#7a5660] shadow-[0_10px_22px_rgba(122,86,96,0.18)]"
                          )}
                        >
                          <span>{slot.label}</span>
                          <span className="mt-1 text-[10px] font-semibold">
                            {slot.booked
                              ? "Booked"
                              : isSelected
                                ? "Selected"
                                : "Available"}
                          </span>
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </div>
              </section>

              <aside className="flex flex-col justify-center gap-5">
                <Card className="rounded-lg border-0 bg-white/92 shadow-[0_20px_60px_rgba(77,59,54,0.16)] ring-[#eaded4] [--card-spacing:--spacing(5)]">
                  <CardHeader>
                    <CardTitle className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#725c60]">
                      Resumo do Agendamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[#ead1ca] text-[#7a5660]">
                        <HugeiconsIcon
                          aria-hidden="true"
                          icon={SparklesIcon}
                          size={22}
                          strokeWidth={1.6}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#3f3334]">
                          Signature Bridal Glow
                        </p>
                        <p className="text-xs text-[#7d6c6c]">
                          Artista: Layza Mirelle
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-[#eee4dc]" />

                    <div className="flex flex-col gap-3 text-sm font-medium text-[#4b4142]">
                      <div className="flex items-center gap-3">
                        <DetailIcon icon={Calendar03Icon} className="text-[#725c60]" />
                        <span>{selectedDateLabel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DetailIcon icon={Clock01Icon} className="text-[#725c60]" />
                        <span>
                          {selectedTimeLabel}
                          {selectedTime ? ` (${getDuration(selectedTime)} mins)` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DetailIcon icon={Location01Icon} className="text-[#725c60]" />
                        <span>Studio B, Downtown</span>
                      </div>
                    </div>

                    <div className="rounded-md bg-[#f2eee8] p-4 text-sm">
                      <div className="flex items-center justify-between text-[#756667]">
                        <span>Taxa de serviço</span>
                        <span>$150.00</span>
                      </div>
                      <Separator className="my-3 bg-[#e1d7cf]" />
                      <div className="flex items-center justify-between font-bold text-[#725c60]">
                        <span>Total</span>
                        <span>$150.00</span>
                      </div>
                    </div>

                    <div className="rounded-md bg-[#fff8f2] p-3 text-xs leading-5 text-[#756667] ring-1 ring-[#eaded4]">
                      <p className="font-bold text-[#725c60]">Horário</p>
                      <p className="break-all font-mono">{selectedTimestamp || "Select date and time"}</p>
                      <p>{TIME_ZONE}</p>
                    </div>

                    {confirmedAppointment ? (
                      <div className="rounded-md bg-[#eef6f1] p-3 text-xs leading-5 text-[#526963] ring-1 ring-[#d9e7df]">
                        <p className="font-bold text-[#536f66]">Agendamento confirmado</p>
                        <p className="break-all font-mono">
                          {confirmedAppointment.date}-{confirmedAppointment.time}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-3">
                    <Button
                      className="h-11 rounded-md bg-[#725c60] text-white hover:bg-[#634f53]"
                      disabled={!selectedDate || !selectedTime}
                      onClick={handleConfirm}
                    >
                      Confirmar Agendamento
                      <HugeiconsIcon
                        aria-hidden="true"
                        icon={ArrowRight01Icon}
                        size={16}
                        strokeWidth={1.8}
                        data-icon="inline-end"
                      />
                    </Button>
                  </CardFooter>
                </Card>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
