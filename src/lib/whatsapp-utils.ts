
export function openWhatsAppLink(phoneNumber: string, message: string) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
}

export function getClientWelcomeMessage(clientName: string, catalogLink: string): string {
  return `¡Hola ${clientName}! 👋

Tu cuenta está lista. Ya podés hacer tu pedido directamente desde nuestro catálogo:

${catalogLink}

¡Estamos para lo que necesites!`;
}

export function getOnboardingInviteMessage(clientName: string, onboardingLink: string): string {
  return `¡Hola ${clientName}! 👋

Te damos la bienvenida a Mr. Blonde.

Para comenzar a hacer tus pedidos, necesitamos que completes tu registro:

${onboardingLink}

¿Tenés alguna duda? Estamos para ayudarte.`;
}

export function getAgreementAssignedMessage(clientName: string, catalogLink: string): string {
  return `¡Hola ${clientName}! 🎉

Buenas noticias. Tu solicitud fue aprobada y ya tenés acceso a precios especiales.

Hacé tu primer pedido desde aquí:

${catalogLink}

¡Saludamos desde Mr. Blonde!`;
}

export function getPendingAgreementMessage(clientName: string, adminPhone: string): string {
  return `¡Hola ${clientName}! 👋

Tu registro está casi completo.

Estamos revisando tu solicitud y te notificaremos cuando esté lista.

Si tenés alguna urgencia, contactanos al: ${adminPhone}`;
}
