/**
 * Represents the details required to schedule a reminder.
 */
export interface ReminderDetails {
  /**
   * The email address to send the reminder to.
   */
  email: string;
  /**
   * The phone number to send the whatsapp reminder to.
   */
  phoneNumber: string;
  /**
   * The date and time for the reminder to be sent.
   */
  reminderDateTime: Date;
  /**
   * A message content for the reminder.
   */
  message: string;
}

/**
 * Asynchronously schedules a reminder to be sent via email and WhatsApp.
 * @param reminderDetails The details of the reminder to schedule.
 * @returns A promise that resolves to true if the reminder was scheduled successfully, false otherwise.
 */
export async function scheduleReminder(reminderDetails: ReminderDetails): Promise<boolean> {
  // TODO: Implement this by calling an API.

  console.log(`Reminder scheduled for ${reminderDetails.email} and ${reminderDetails.phoneNumber} at ${reminderDetails.reminderDateTime}: ${reminderDetails.message}`);
  return true;
}
