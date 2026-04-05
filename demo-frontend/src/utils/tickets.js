import { humanizeEnum } from './formatters';

export function getTicketNumber(ticket) {
  if (!ticket) {
    return 'Ticket';
  }

  return ticket.ticketNumber || `TKT-${ticket.id}`;
}

export function toTicketLookupOption(ticket) {
  if (!ticket) {
    return null;
  }

  return {
    value: String(ticket.id),
    label: `${getTicketNumber(ticket)} • ${ticket.title || 'Untitled ticket'}`,
    description: [ticket.status ? humanizeEnum(ticket.status) : '', ticket.priority ? humanizeEnum(ticket.priority) : '']
      .filter(Boolean)
      .join(' • '),
    ticket,
  };
}

export function toAssigneeOption(assigneeEntry) {
  const user = assigneeEntry?.user || assigneeEntry;

  if (!user?.id) {
    return null;
  }

  return {
    value: String(user.id),
    label: user.fullName || user.email || `User #${user.id}`,
    description: [assigneeEntry?.projectRole ? humanizeEnum(assigneeEntry.projectRole) : '', user.email || '']
      .filter(Boolean)
      .join(' • '),
    user,
  };
}
