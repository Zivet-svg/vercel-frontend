document.addEventListener('DOMContentLoaded', function() {
    const purchaseForm = document.getElementById('purchaseForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');
    
    // Discount system
    let appliedDiscount = null;
    const originalPrices = { monthly: 5.00, lifetime: 20.00 };
    
    // Predefined discount codes
    const discountCodes = {
        'WELCOME10': { type: 'percentage', value: 10, description: '10% off' },
        'SAVE20': { type: 'percentage', value: 20, description: '20% off' },
        'FIRST5': { type: 'fixed', value: 5, description: '$5 off' },
        'LIFETIME25': { type: 'percentage', value: 25, description: '25% off (Lifetime only)', planRestriction: 'lifetime' },
        'NEWUSER': { type: 'percentage', value: 15, description: '15% off' },
        'DISCORD': { type: 'fixed', value: 3, description: '$3 off' }
    };
    
    // Get plan from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    
    if (planParam) {
        const planRadio = document.getElementById(planParam);
        if (planRadio) {
            planRadio.checked = true;
        }
    }
    
    // Discount code functionality
    function updatePriceDisplay() {
        const monthlyPriceEl = document.getElementById('monthlyPrice');
        const lifetimePriceEl = document.getElementById('lifetimePrice');
        const monthlyOriginalEl = document.getElementById('monthlyOriginal');
        const lifetimeOriginalEl = document.getElementById('lifetimeOriginal');
        
        if (appliedDiscount) {
            const monthlyDiscounted = calculateDiscountedPrice('monthly', appliedDiscount);
            const lifetimeDiscounted = calculateDiscountedPrice('lifetime', appliedDiscount);
            
            // Show discounted prices
            if (monthlyDiscounted < originalPrices.monthly) {
                monthlyPriceEl.textContent = `$${monthlyDiscounted.toFixed(2)}`;
                monthlyOriginalEl.textContent = `$${originalPrices.monthly.toFixed(2)}`;
                monthlyOriginalEl.classList.remove('d-none');
            }
            
            if (lifetimeDiscounted < originalPrices.lifetime) {
                lifetimePriceEl.textContent = `$${lifetimeDiscounted.toFixed(2)}`;
                lifetimeOriginalEl.textContent = `$${originalPrices.lifetime.toFixed(2)}`;
                lifetimeOriginalEl.classList.remove('d-none');
            }
        } else {
            // Reset to original prices
            monthlyPriceEl.textContent = `$${originalPrices.monthly.toFixed(2)}`;
            lifetimePriceEl.textContent = `$${originalPrices.lifetime.toFixed(2)}`;
            monthlyOriginalEl.classList.add('d-none');
            lifetimeOriginalEl.classList.add('d-none');
        }
    }
    
    function calculateDiscountedPrice(plan, discount) {
        const originalPrice = originalPrices[plan];
        
        if (discount.planRestriction && discount.planRestriction !== plan) {
            return originalPrice;
        }
        
        if (discount.type === 'percentage') {
            return originalPrice * (1 - discount.value / 100);
        } else if (discount.type === 'fixed') {
            return Math.max(0, originalPrice - discount.value);
        }
        
        return originalPrice;
    }
    
    // Apply discount code
    document.getElementById('applyDiscount').addEventListener('click', function() {
        const codeInput = document.getElementById('discount_code');
        const code = codeInput.value.trim().toUpperCase();
        const messageEl = document.getElementById('discountMessage');
        const appliedEl = document.getElementById('discountApplied');
        const detailsEl = document.getElementById('discountDetails');
        
        if (!code) {
            messageEl.innerHTML = '<div class="alert alert-warning">Please enter a discount code.</div>';
            return;
        }
        
        if (discountCodes[code]) {
            appliedDiscount = { code: code, ...discountCodes[code] };
            
            messageEl.innerHTML = '';
            appliedEl.classList.remove('d-none');
            detailsEl.textContent = `${code} - ${appliedDiscount.description}`;
            codeInput.value = '';
            updatePriceDisplay();
        } else {
            messageEl.innerHTML = '<div class="alert alert-danger">Invalid discount code.</div>';
            appliedEl.classList.add('d-none');
        }
    });
    
    // Remove discount
    document.getElementById('removeDiscount').addEventListener('click', function() {
        appliedDiscount = null;
        document.getElementById('discountApplied').classList.add('d-none');
        document.getElementById('discountMessage').innerHTML = '';
        updatePriceDisplay();
    });
    
    // Allow Enter key to apply discount
    document.getElementById('discount_code').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('applyDiscount').click();
        }
    });
    
    purchaseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const discordUsername = document.getElementById('discord_username').value.trim();
        const email = document.getElementById('email').value.trim();
        const productType = document.querySelector('input[name="product_type"]:checked').value;
        const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
        let paymentProof = '';
        if (paymentMethod === 'paypal') {
            paymentProof = document.getElementById('paypal_proof').value.trim();
            if (!paymentProof) {
                alert('Please enter your PayPal email or transaction ID.');
                return;
            }
        } else if (paymentMethod === 'ltc') {
            paymentProof = document.getElementById('ltc_proof').value.trim();
            if (!paymentProof) {
                alert('Please enter your LTC transaction ID.');
                return;
            }
        } else if (paymentMethod === 'other') {
            paymentProof = 'User will DM on Discord.';
        }
        
        // Basic validation
        if (!discordUsername || !email) {
            alert('Please fill in all fields');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Disable button and show loading
        submitBtn.disabled = true;
        btnText.classList.add('d-none');
        btnLoading.classList.remove('d-none');
        
        try {
            // Calculate final price with discount
            let finalPrice = originalPrices[productType];
            let discountInfo = null;
            
            if (appliedDiscount) {
                finalPrice = calculateDiscountedPrice(productType, appliedDiscount);
                discountInfo = {
                    code: appliedDiscount.code,
                    description: appliedDiscount.description,
                    originalPrice: originalPrices[productType],
                    discountedPrice: finalPrice,
                    savings: originalPrices[productType] - finalPrice
                };
            }
            
            // Trigger Discord register flow (same as !register command)
            const response = await fetch('https://afa2-67-205-158-33.ngrok-free.app/auth/trigger-discord-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    discord_username: discordUsername,
                    product_type: productType,
                    payment_method: paymentMethod,
                    payment_proof: paymentProof,
                    discount_info: discountInfo,
                    final_price: finalPrice
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                let message = data.message || 'Registration complete! Check your Discord DMs for login credentials.';
                
                if (discountInfo && discountInfo.savings > 0) {
                    message += `\n\nDiscount Applied: ${discountInfo.code}\nFinal Price: $${finalPrice.toFixed(2)} (You saved $${discountInfo.savings.toFixed(2)}!)`;
                }
                
                alert(message);
                purchaseForm.reset();
                appliedDiscount = null;
                updatePriceDisplay();
                document.getElementById('discountApplied').classList.add('d-none');
            } else {
                const data = await response.json();
                alert('Error: ' + (data.error || 'Failed to submit.'));
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
            
            // Re-enable button
            submitBtn.disabled = false;
            btnText.classList.remove('d-none');
            btnLoading.classList.add('d-none');
        }
    });
    
    // Handle plan selection visual feedback
    const planOptions = document.querySelectorAll('.plan-option');
    planOptions.forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
        });
    });
}); 