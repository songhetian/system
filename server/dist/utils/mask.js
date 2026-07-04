export function maskPhone(phone) {
    if (!phone || phone.length < 7)
        return '****';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
}
export function maskIdCard(idCard) {
    if (!idCard || idCard.length < 8)
        return '****';
    return idCard.slice(0, 3) + '***********' + idCard.slice(-4);
}
export function maskSalary(_salary) {
    return '****';
}
export function maskEmail(email) {
    if (!email || !email.includes('@'))
        return '****';
    const [local, domain] = email.split('@');
    if (local.length <= 1)
        return '*@' + domain;
    return local[0] + '**@' + domain;
}
//# sourceMappingURL=mask.js.map